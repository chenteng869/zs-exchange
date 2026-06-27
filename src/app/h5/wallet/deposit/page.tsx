'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  Copy,
  Loader2,
  QrCode,
  RefreshCw,
  ShieldCheck,
  Wallet,
} from 'lucide-react';
import { walletApi, type DepositAddress, type WalletBalance, type WalletDeposit } from '@/lib/api/wallet';

const CURRENCIES = ['USDT', 'BTC', 'ETH'];
const NETWORKS = [
  { label: 'TRC20', value: 'TRON' },
  { label: 'ERC20', value: 'ETHEREUM' },
  { label: 'BEP20', value: 'BSC' },
  { label: 'Solana', value: 'SOLANA' },
];

function shortAddress(address: string): string {
  if (address.length <= 18) return address;
  return `${address.slice(0, 10)}...${address.slice(-8)}`;
}

function statusText(status: string): string {
  if (status === 'credited') return '已入账';
  if (status === 'confirmed') return '已确认';
  if (status === 'confirming') return '确认中';
  return '待确认';
}

export default function H5DepositPage() {
  const [currency, setCurrency] = useState('USDT');
  const [chain, setChain] = useState('TRON');
  const [address, setAddress] = useState<DepositAddress | null>(null);
  const [balance, setBalance] = useState<WalletBalance | null>(null);
  const [deposits, setDeposits] = useState<WalletDeposit[]>([]);
  const [amount, setAmount] = useState('12.5');
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const selectedNetwork = useMemo(
    () => NETWORKS.find((item) => item.value === chain) || NETWORKS[0],
    [chain],
  );

  const loadDeposit = useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const [nextAddress, balances, history] = await Promise.all([
        walletApi.getDepositAddress(currency, chain),
        walletApi.getBalances(),
        walletApi.getDeposits(currency),
      ]);
      setAddress(nextAddress);
      setBalance(balances.find((item) => item.currency === currency) || null);
      setDeposits(history.list.slice(0, 5));
    } catch (e: any) {
      setAddress(null);
      setBalance(null);
      setDeposits([]);
      setError(e?.message || '充值信息加载失败');
    } finally {
      setLoading(false);
    }
  }, [chain, currency]);

  useEffect(() => {
    loadDeposit();
  }, [loadDeposit]);

  const copyAddress = async () => {
    if (!address?.address) return;
    await navigator.clipboard.writeText(address.address);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };

  const simulateDeposit = async () => {
    if (!address) return;
    setSimulating(true);
    setError('');
    setMessage('');

    try {
      const result = await walletApi.simulateDeposit({
        currency,
        chain,
        address: address.address,
        txHash: `h5_${currency}_${Date.now()}`,
        amount,
        confirmations: address.requiredConfirmations,
      });
      setMessage(result.credited ? '模拟充值已确认并入账' : `充值状态：${statusText(result.deposit.status)}`);
      await loadDeposit();
    } catch (e: any) {
      setError(e?.message || '模拟充值失败');
    } finally {
      setSimulating(false);
    }
  };

  const cardStyle: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(18, 31, 68, 0.92) 0%, rgba(13, 23, 52, 0.94) 100%)',
    border: '1px solid rgba(148, 163, 184, 0.14)',
    borderRadius: 16,
    padding: 14,
    boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)',
  };

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#F8FAFC' }}>数字资产充值</div>
          <div style={{ fontSize: 12, color: '#7B89B8', marginTop: 3 }}>真实地址申请、确认、入账闭环</div>
        </div>
        <button
          onClick={loadDeposit}
          disabled={loading}
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            border: '1px solid rgba(56, 189, 248, 0.28)',
            background: 'rgba(56, 189, 248, 0.12)',
            color: '#38BDF8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="刷新充值信息"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
        </button>
      </div>

      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          {CURRENCIES.map((item) => {
            const active = item === currency;
            return (
              <button
                key={item}
                onClick={() => setCurrency(item)}
                style={{
                  flex: 1,
                  height: 38,
                  borderRadius: 10,
                  border: active ? '1px solid rgba(56, 189, 248, 0.52)' : '1px solid rgba(148, 163, 184, 0.16)',
                  background: active ? 'rgba(56, 189, 248, 0.18)' : 'rgba(148, 163, 184, 0.08)',
                  color: active ? '#38BDF8' : '#B4C0E0',
                  fontWeight: 700,
                }}
              >
                {item}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 7 }}>
          {NETWORKS.map((item) => {
            const active = item.value === chain;
            return (
              <button
                key={item.value}
                onClick={() => setChain(item.value)}
                style={{
                  height: 34,
                  borderRadius: 9,
                  border: active ? '1px solid rgba(240, 185, 11, 0.50)' : '1px solid rgba(148, 163, 184, 0.14)',
                  background: active ? 'rgba(240, 185, 11, 0.14)' : 'rgba(148, 163, 184, 0.06)',
                  color: active ? '#FCD535' : '#7B89B8',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 12, textAlign: 'center' }}>
        <div
          style={{
            width: 176,
            height: 176,
            margin: '0 auto 14px',
            borderRadius: 16,
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'inset 0 0 0 8px rgba(15, 27, 61, 0.08)',
          }}
        >
          <QrCode size={128} color="#0F1B3D" />
        </div>

        <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 8 }}>
          {currency} / {selectedNetwork.label} 充值地址
        </div>

        <div
          style={{
            padding: 12,
            borderRadius: 12,
            background: 'rgba(15, 27, 61, 0.58)',
            border: '1px solid rgba(148, 163, 184, 0.16)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            textAlign: 'left',
          }}
        >
          <span style={{ flex: 1, minWidth: 0, color: '#F8FAFC', fontSize: 12, fontFamily: 'monospace' }}>
            {loading ? '地址生成中...' : address ? shortAddress(address.address) : '请先登录后获取充值地址'}
          </span>
          <button
            onClick={copyAddress}
            disabled={!address}
            style={{
              height: 30,
              padding: '0 10px',
              borderRadius: 8,
              border: '1px solid rgba(56, 189, 248, 0.30)',
              background: 'rgba(56, 189, 248, 0.14)',
              color: '#38BDF8',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 12,
              opacity: address ? 1 : 0.5,
            }}
          >
            {copied ? <CheckCircle2 size={13} /> : <Copy size={13} />}
            {copied ? '已复制' : '复制'}
          </button>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <div style={{ fontSize: 11, color: '#7B89B8' }}>现货可用</div>
            <div style={{ marginTop: 4, color: '#F8FAFC', fontWeight: 800, fontSize: 17 }}>
              {balance ? `${balance.available} ${currency}` : `0 ${currency}`}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: '#7B89B8' }}>确认要求</div>
            <div style={{ marginTop: 4, color: '#FCD535', fontWeight: 800, fontSize: 17 }}>
              {address?.requiredConfirmations ?? '-'} 次
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ ...cardStyle, marginBottom: 12, borderColor: 'rgba(244, 114, 182, 0.35)' }}>
          <div style={{ display: 'flex', gap: 8, color: '#F472B6', fontSize: 12, lineHeight: 1.5 }}>
            <AlertCircle size={16} />
            <span>
              {error}
              {error.includes('Authorization') && (
                <>
                  {' '}
                  <Link href="/h5/login" style={{ color: '#38BDF8' }}>
                    去登录
                  </Link>
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {message && (
        <div style={{ ...cardStyle, marginBottom: 12, borderColor: 'rgba(52, 211, 153, 0.30)' }}>
          <div style={{ display: 'flex', gap: 8, color: '#34D399', fontSize: 12 }}>
            <CheckCircle2 size={16} />
            <span>{message}</span>
          </div>
        </div>
      )}

      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <ShieldCheck size={16} color="#FCD535" />
          <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>开发联调验证</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="decimal"
            style={{
              flex: 1,
              minWidth: 0,
              height: 40,
              borderRadius: 10,
              border: '1px solid rgba(148, 163, 184, 0.16)',
              background: 'rgba(15, 27, 61, 0.58)',
              color: '#F8FAFC',
              padding: '0 10px',
              outline: 'none',
            }}
          />
          <button
            onClick={simulateDeposit}
            disabled={!address || simulating}
            style={{
              height: 40,
              padding: '0 12px',
              borderRadius: 10,
              border: '1px solid rgba(52, 211, 153, 0.35)',
              background: 'rgba(52, 211, 153, 0.14)',
              color: '#34D399',
              fontWeight: 700,
              opacity: address && !simulating ? 1 : 0.55,
            }}
          >
            {simulating ? '入账中...' : '模拟到账'}
          </button>
        </div>
      </div>

      <div style={{ ...cardStyle, marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <Wallet size={16} color="#38BDF8" />
          <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 700 }}>最近充值</span>
        </div>
        {deposits.length === 0 ? (
          <div style={{ color: '#7B89B8', fontSize: 12, padding: '8px 0' }}>暂无充值记录</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {deposits.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '10px 0',
                  borderTop: '1px solid rgba(148, 163, 184, 0.08)',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <div style={{ color: '#F8FAFC', fontSize: 12, fontFamily: 'monospace' }}>
                    {shortAddress(item.txHash)}
                  </div>
                  <div style={{ color: '#7B89B8', fontSize: 11, marginTop: 3 }}>
                    {item.confirmations}/{item.requiredConfirmations} confirmations
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ color: '#34D399', fontWeight: 700, fontSize: 12 }}>
                    +{item.amount} {currency}
                  </div>
                  <div style={{ color: item.status === 'credited' ? '#34D399' : '#FCD535', fontSize: 11, marginTop: 3 }}>
                    {statusText(item.status)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div
        style={{
          display: 'flex',
          gap: 10,
          padding: 12,
          borderRadius: 14,
          border: '1px solid rgba(240, 185, 11, 0.24)',
          background: 'rgba(240, 185, 11, 0.09)',
          color: '#B4C0E0',
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        <AlertCircle size={16} color="#FCD535" style={{ flexShrink: 0, marginTop: 2 }} />
        <div>
          <div style={{ color: '#FCD535', fontWeight: 700, marginBottom: 4 }}>充值须知</div>
          仅向该地址充值 {currency} / {selectedNetwork.label} 资产；少于最小充值额或网络选择错误可能无法自动入账。
          实盘环境中地址应由 KMS/MPC 地址服务生成，本页当前接入 MVP 后端闭环。
        </div>
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}
