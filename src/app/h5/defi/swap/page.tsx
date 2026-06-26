'use client';

import { useState } from 'react';
import {
  Repeat,
  ArrowDown,
  Settings2,
  Info,
  Zap,
  Wallet,
  CheckCircle2,
} from 'lucide-react';

export default function H5DefiSwapPage() {
  const [fromToken, setFromToken] = useState('ETH');
  const [fromAmount, setFromAmount] = useState('1.0000');
  const [toToken, setToToken] = useState('USDT');
  const [toAmount] = useState('3,512.80');
  const [slippage, setSlippage] = useState('0.5');

  const swap = () => {
    const t = fromToken;
    setFromToken(toToken);
    setToToken(t);
  };

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>代币兑换</span>
        <button
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '6px 10px',
            borderRadius: 8,
            background: 'rgba(56, 189, 248, 0.10)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: '#38BDF8',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Settings2 size={11} /> 滑点 {slippage}%
        </button>
      </div>

      {/* 兑换区 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 18,
          padding: 14,
          marginBottom: 12,
          position: 'relative',
        }}
      >
        <InputBox
          label="从"
          token={fromToken}
          amount={fromAmount}
          onChange={setFromAmount}
          balance="12.456 ETH"
        />

        <div
          onClick={swap}
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            margin: '6px 0',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
              border: '4px solid #131E45',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(56, 189, 248, 0.40)',
            }}
          >
            <Repeat size={16} color="#fff" />
          </div>
        </div>

        <InputBox
          label="至"
          token={toToken}
          amount={toAmount}
          onChange={() => {}}
          balance="32,456.78 USDT"
          readOnly
        />
      </div>

      {/* 详情 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <Zap size={12} color="#FCD535" />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>兑换详情</span>
        </div>
        <InfoRow label="汇率"     value={`1 ${fromToken} = 3,512.80 ${toToken}`} />
        <InfoRow label="价格影响" value="0.12%" color="#34D399" />
        <InfoRow label="手续费"   value="0.3% (~$10.50)" />
        <InfoRow label="最低收到" value="3,495.04 USDT" />
        <InfoRow label="Gas 费用" value="~$2.80" last />
      </div>

      {/* 滑点快捷 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#7B89B8' }}>滑点容忍度</span>
          <span style={{ fontSize: 12, color: '#FCD535', fontWeight: 600 }}>{slippage}%</span>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['0.1', '0.5', '1.0', '3.0'].map((s) => (
            <button
              key={s}
              onClick={() => setSlippage(s)}
              style={{
                flex: 1,
                padding: '6px 0',
                borderRadius: 8,
                background: slippage === s ? 'rgba(240, 185, 11, 0.20)' : 'rgba(148, 163, 184, 0.10)',
                border: '1px solid',
                borderColor: slippage === s ? '#F0B90B' : 'rgba(148, 163, 184, 0.20)',
                color: slippage === s ? '#FCD535' : '#7B89B8',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {s}%
            </button>
          ))}
        </div>
      </div>

      {/* 提示 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          background: 'rgba(167, 139, 250, 0.08)',
          border: '1px solid rgba(167, 139, 250, 0.20)',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <Info size={14} color="#A78BFA" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.6 }}>
          兑换由 ZS Router 智能路由，自动寻找最优价格路径，包括 ETH/USDT 池及跨池组合。
        </div>
      </div>

      <button
        style={{
          width: '100%',
          padding: '14px 0',
          background: 'linear-gradient(135deg, #A78BFA 0%, #7C3AED 100%)',
          color: '#fff',
          fontSize: 15,
          fontWeight: 800,
          border: 'none',
          borderRadius: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          boxShadow: '0 4px 16px rgba(167, 139, 250, 0.30)',
        }}
      >
        <CheckCircle2 size={16} strokeWidth={2.5} /> 确认兑换
      </button>

      <div style={{ height: 20 }} />
    </div>
  );
}

function InputBox({
  label,
  token,
  amount,
  onChange,
  balance,
  readOnly,
}: {
  label: string;
  token: string;
  amount: string;
  onChange: (v: string) => void;
  balance: string;
  readOnly?: boolean;
}) {
  return (
    <div
      style={{
        background: 'rgba(15, 27, 61, 0.50)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: 14,
        padding: 12,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: '#7B89B8' }}>{label}</span>
        <span style={{ fontSize: 11, color: '#7B89B8', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Wallet size={11} /> {balance}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          value={amount}
          onChange={(e) => onChange(e.target.value)}
          readOnly={readOnly}
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#F8FAFC',
            fontSize: 22,
            fontWeight: 700,
            fontFamily: 'inherit',
            fontVariantNumeric: 'tabular-nums',
          }}
        />
        <button
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: 'rgba(56, 189, 248, 0.20)',
            borderRadius: 10,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              width: 22,
              height: 22,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 11,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            {token.charAt(0)}
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{token}</span>
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value, color, last }: { label: string; value: string; color?: string; last?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '6px 0',
        fontSize: 12,
        borderBottom: last ? 'none' : '1px solid rgba(148, 163, 184, 0.06)',
      }}
    >
      <span style={{ color: '#7B89B8' }}>{label}</span>
      <span style={{ color: color || '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
    </div>
  );
}
