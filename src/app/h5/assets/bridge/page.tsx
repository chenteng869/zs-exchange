'use client';

/**
 * H5 跨链桥页
 */
import { useEffect, useState } from 'react';
import { Network, ArrowLeftRight, Clock, Zap } from 'lucide-react';
import { walletApi, type WalletBalance } from '@/lib/api/wallet';

const CHAINS = [
  { key: 'eth',    label: 'Ethereum',  color: '#627EEA', gas: '$1.20', time: '≈ 3分钟' },
  { key: 'bsc',    label: 'BNB Chain', color: '#F0B90B', gas: '$0.20', time: '≈ 2分钟' },
  { key: 'tron',   label: 'TRON',      color: '#FF060A', gas: '$0.00', time: '≈ 1分钟' },
  { key: 'solana', label: 'Solana',    color: '#9945FF', gas: '$0.01', time: '≈ 30秒'  },
  { key: 'polygon',label: 'Polygon',   color: '#8247E5', gas: '$0.05', time: '≈ 1分钟' },
  { key: 'arb',    label: 'Arbitrum',  color: '#28A0F0', gas: '$0.30', time: '≈ 2分钟' },
];

const RECENT_BRIDGES = [
  { id: 'B1', from: 'Ethereum', to: 'BNB Chain', token: 'USDT', amount: '1,000.00', time: '10分钟前', status: 'success' },
  { id: 'B2', from: 'TRON',      to: 'Ethereum', token: 'USDT', amount: '500.00',   time: '1小时前',  status: 'success' },
  { id: 'B3', from: 'BSC',       to: 'Polygon',  token: 'BNB',  amount: '0.500',    time: '2小时前',  status: 'pending' },
];

interface BridgeCoin {
  symbol: string;
  amount: string;
}

const DEFAULT_COIN: BridgeCoin = { symbol: 'USDT', amount: '0' };

function toBridgeCoin(balance: WalletBalance): BridgeCoin {
  return {
    symbol: balance.currency,
    amount: balance.available || balance.balance || '0',
  };
}

export default function H5BridgePage() {
  const [from, setFrom] = useState('eth');
  const [to, setTo] = useState('bsc');
  const [coins, setCoins] = useState<BridgeCoin[]>([DEFAULT_COIN]);
  const [coin, setCoin] = useState<BridgeCoin>(DEFAULT_COIN);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    let alive = true;

    walletApi.getBalances()
      .then((balances) => {
        if (!alive) return;
        const nextCoins = balances.map(toBridgeCoin);
        setCoins(nextCoins.length > 0 ? nextCoins : [DEFAULT_COIN]);
        setCoin(nextCoins[0] ?? DEFAULT_COIN);
      })
      .catch(() => {
        if (!alive) return;
        setCoins([DEFAULT_COIN]);
        setCoin(DEFAULT_COIN);
      });

    return () => {
      alive = false;
    };
  }, []);

  const swap = () => {
    const tmp = from;
    setFrom(to);
    setTo(tmp);
  };

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>跨链桥</span>
        <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>
          支持 6 大主流公链,资产安全跨链
        </div>
      </div>

      {/* From 链 */}
      <ChainSelector label="从" activeKey={from} onChange={setFrom} chains={CHAINS} balance={`${coin.amount} ${coin.symbol}`} />

      {/* 交换 */}
      <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
        <button
          onClick={swap}
          style={{
            width: 40, height: 40, borderRadius: 20,
            background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(56, 189, 248, 0.30)',
            zIndex: 2,
          }}
        >
          <ArrowLeftRight size={18} color="#fff" />
        </button>
      </div>

      {/* To 链 */}
      <ChainSelector label="到" activeKey={to} onChange={setTo} chains={CHAINS} balance="" />

      {/* 币种 + 数量 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16, padding: 14, marginBottom: 12, marginTop: -8,
        }}
      >
        <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 8 }}>选择币种</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
          {coins.slice(0, 5).map((a) => (
            <button
              key={a.symbol}
              onClick={() => setCoin(a)}
              style={{
                padding: '8px 16px', borderRadius: 10,
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
          <span style={{ fontSize: 12, color: '#7B89B8' }}>跨链数量</span>
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

      {/* 费用 + 时间 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 12, padding: 12, marginBottom: 12,
        }}
      >
        <Row icon={Zap}    label="跨链费用" value="$1.40 (Gas + 服务费)" color="#FCD535" />
        <Row icon={Clock}  label="预计到账" value="≈ 2-3 分钟" color="#38BDF8" />
        <Row icon={Network} label="桥协议"   value="ZS Bridge V2" color="#A78BFA" />
      </div>

      {/* 提交 */}
      <button
        style={{
          width: '100%',
          padding: '14px 0', borderRadius: 12, border: 'none',
          background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
          color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(56, 189, 248, 0.30)',
        }}
      >
        立即跨链
      </button>

      {/* 最近跨链 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 4px 8px' }}>
        <div
          style={{
            width: 3, height: 14, borderRadius: 2,
            background: 'linear-gradient(180deg, #38BDF8 0%, #1E40AF 100%)',
            boxShadow: '0 0 6px rgba(56, 189, 248, 0.50)',
          }}
        />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>最近跨链</span>
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16, overflow: 'hidden',
        }}
      >
        {RECENT_BRIDGES.map((b, i) => (
          <div
            key={b.id}
            style={{
              display: 'flex', alignItems: 'center', padding: 12, gap: 10,
              borderBottom: i < RECENT_BRIDGES.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
            }}
          >
            <div
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: 'rgba(56, 189, 248, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Network size={14} color="#38BDF8" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>
                {b.from} → {b.to}
              </div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{b.time}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {b.amount} {b.token}
              </div>
              <div
                style={{
                  fontSize: 10, color: b.status === 'success' ? '#34D399' : '#FCD535', marginTop: 2,
                }}
              >
                {b.status === 'success' ? '已完成' : '处理中'}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function ChainSelector({ label, activeKey, onChange, chains, balance }: any) {
  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: 16, padding: 14, marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: '#7B89B8' }}>{label}</span>
        {balance && <span style={{ fontSize: 11, color: '#7B89B8' }}>{balance}</span>}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {chains.map((c: any) => {
          const active = c.key === activeKey;
          return (
            <button
              key={c.key}
              onClick={() => onChange(c.key)}
              style={{
                padding: '10px 4px', borderRadius: 10,
                background: active ? `${c.color}26` : 'rgba(148, 163, 184, 0.06)',
                border: active ? `1px solid ${c.color}50` : '1px solid rgba(148, 163, 184, 0.10)',
                cursor: 'pointer', textAlign: 'center',
              }}
            >
              <div style={{ fontSize: 12, fontWeight: 600, color: active ? c.color : '#B4C0E0' }}>{c.label}</div>
              <div style={{ fontSize: 9, color: '#7B89B8', marginTop: 2 }}>{c.time}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Row({ icon: Icon, label, value, color }: any) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <Icon size={12} color={color} />
        <span style={{ fontSize: 12, color: '#7B89B8' }}>{label}</span>
      </div>
      <span style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>{value}</span>
    </div>
  );
}
