'use client';

/**
 * H5 划转页
 */
import { useState } from 'react';
import { ArrowLeftRight, Wallet, PiggyBank, TrendingUp, Check } from 'lucide-react';
import { getAssets } from '@/lib/h5-mock';

const FROM_ACCOUNTS = [
  { key: 'spot',    label: '现货账户',   icon: Wallet,     color: '#38BDF8' },
  { key: 'fund',    label: '理财账户',   icon: PiggyBank,  color: '#FCD535' },
  { key: 'futures', label: '合约账户',   icon: TrendingUp, color: '#F472B6' },
];

const TO_ACCOUNTS = [
  { key: 'spot',    label: '现货账户',   icon: Wallet,     color: '#38BDF8' },
  { key: 'fund',    label: '理财账户',   icon: PiggyBank,  color: '#FCD535' },
  { key: 'futures', label: '合约账户',   icon: TrendingUp, color: '#F472B6' },
];

export default function H5TransferPage() {
  const [from, setFrom] = useState('spot');
  const [to, setTo] = useState('fund');
  const [coin, setCoin] = useState(getAssets()[2]);
  const [amount, setAmount] = useState('');

  const swap = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
  };

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>账户划转</span>
      </div>

      {/* From 账户 */}
      <AccountSelector
        label="从"
        activeKey={from}
        onChange={setFrom}
        accounts={FROM_ACCOUNTS}
        balance={`可用: ${coin.amount} ${coin.symbol}`}
      />

      {/* 交换按钮 */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
        <button
          onClick={swap}
          style={{
            width: 40, height: 40, borderRadius: 20,
            background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(252, 213, 53, 0.30)',
            zIndex: 2,
          }}
        >
          <ArrowLeftRight size={18} color="#0F1B3D" />
        </button>
      </div>

      {/* To 账户 */}
      <AccountSelector
        label="到"
        activeKey={to}
        onChange={setTo}
        accounts={TO_ACCOUNTS}
        balance=""
      />

      {/* 币种 + 数量 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
          marginTop: -8,
        }}
      >
        <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 8 }}>选择币种</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {getAssets().slice(0, 5).map((a) => (
            <button
              key={a.symbol}
              onClick={() => setCoin(a)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: a.symbol === coin.symbol ? 'rgba(56, 189, 248, 0.20)' : 'rgba(148, 163, 184, 0.10)',
                border: a.symbol === coin.symbol ? '1px solid rgba(56, 189, 248, 0.40)' : '1px solid rgba(148, 163, 184, 0.18)',
                color: a.symbol === coin.symbol ? '#38BDF8' : '#B4C0E0',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {a.symbol}
            </button>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#7B89B8' }}>划转数量</span>
          <span style={{ fontSize: 11, color: '#7B89B8' }}>
            可用: <span style={{ color: '#FCD535', fontWeight: 600 }}>{coin.amount} {coin.symbol}</span>
          </span>
        </div>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          style={{
            width: '100%',
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
      </div>

      {/* 提交 */}
      <button
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 12,
          border: 'none',
          background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
          color: '#0F1B3D',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(252, 213, 53, 0.30)',
        }}
      >
        立即划转
      </button>

      <div style={{ height: 20 }} />
    </div>
  );
}

function AccountSelector({ label, activeKey, onChange, accounts, balance }: any) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: '#7B89B8' }}>{label}</span>
        {balance && <span style={{ fontSize: 11, color: '#7B89B8' }}>{balance}</span>}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {accounts.map((acc: any) => {
          const Icon = acc.icon;
          const active = acc.key === activeKey;
          return (
            <button
              key={acc.key}
              onClick={() => onChange(acc.key)}
              style={{
                flex: 1, padding: '12px 8px', borderRadius: 12,
                background: active ? `${acc.color}26` : 'rgba(148, 163, 184, 0.06)',
                border: active ? `1px solid ${acc.color}50` : '1px solid rgba(148, 163, 184, 0.10)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <Icon size={14} color={active ? acc.color : '#7B89B8'} />
              <span style={{ fontSize: 12, fontWeight: 600, color: active ? acc.color : '#B4C0E0' }}>
                {acc.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}