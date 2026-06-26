'use client';

import { useState } from 'react';
import {
  Plus,
  ArrowDown,
  Wallet,
  Settings2,
  Info,
  CheckCircle2,
} from 'lucide-react';

export default function H5DefiAddPage() {
  const [tokenA, setTokenA] = useState('ETH');
  const [tokenB, setTokenB] = useState('USDT');
  const [amountA, setAmountA] = useState('0.5000');
  const [amountB, setAmountB] = useState('1,756.40');
  const [slippage, setSlippage] = useState('0.5');

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>添加流动性</span>
      </div>

      {/* 池子信息 */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <div style={{ display: 'flex' }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #38BDF8 0%, #1E40AF 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 800,
              color: '#fff',
            }}
          >
            Ξ
          </div>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #34D399 0%, #10B981 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              fontWeight: 800,
              color: '#fff',
              marginLeft: -10,
            }}
          >
            T
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>ETH / USDT</div>
          <div style={{ fontSize: 10, color: '#7B89B8' }}>手续费 0.3% · APY 12.5%</div>
        </div>
        <button
          style={{
            background: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            color: '#38BDF8',
            padding: '6px 10px',
            borderRadius: 8,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Settings2 size={11} /> 设置
        </button>
      </div>

      {/* 输入 A */}
      <InputBox
        label="输入"
        token={tokenA}
        amount={amountA}
        onChange={setAmountA}
        balance="12.456 ETH"
      />

      {/* 中间转换 */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '-4px 0',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(56, 189, 248, 0.20)',
            border: '4px solid #131E45',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Plus size={14} color="#38BDF8" />
        </div>
      </div>

      {/* 输入 B */}
      <InputBox
        label="输入"
        token={tokenB}
        amount={amountB}
        onChange={setAmountB}
        balance="32,456.78 USDT"
      />

      {/* 详情卡 */}
      <div
        style={{
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginTop: 12,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
          <div style={{ width: 3, height: 12, background: '#F0B90B', borderRadius: 2 }} />
          <span style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>交易详情</span>
        </div>
        <InfoRow label="汇率"       value="1 ETH = 3,512.80 USDT" />
        <InfoRow label="LP 接收量"  value="0.4521 UNI-V2" />
        <InfoRow label="池子份额"   value="0.0012%" />
        <InfoRow label="预计 APY"   value="12.5%" color="#34D399" />
        <InfoRow label="滑点"       value={`${slippage}%`} last />
      </div>

      {/* 提示 */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.20)',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <Info size={14} color="#38BDF8" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.6 }}>
          添加流动性后将获得 LP Token，LP Token 可随时通过「移除流动性」页面赎回对应份额的代币。
        </div>
      </div>

      {/* 确认按钮 */}
      <button
        style={{
          width: '100%',
          padding: '14px 0',
          background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
          color: '#0F1B3D',
          fontSize: 15,
          fontWeight: 800,
          border: 'none',
          borderRadius: 14,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          boxShadow: '0 4px 16px rgba(240, 185, 11, 0.30)',
        }}
      >
        <CheckCircle2 size={16} strokeWidth={2.5} /> 确认添加流动性
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
}: {
  label: string;
  token: string;
  amount: string;
  onChange: (v: string) => void;
  balance: string;
}) {
  return (
    <div
      style={{
        background:
          'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: 16,
        padding: 14,
        marginBottom: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 11, color: '#7B89B8' }}>{label}</span>
        <span style={{ fontSize: 11, color: '#7B89B8', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Wallet size={11} /> {balance}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          value={amount}
          onChange={(e) => onChange(e.target.value)}
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
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 10px',
            background: 'rgba(56, 189, 248, 0.15)',
            borderRadius: 10,
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
          <span style={{ fontSize: 10, color: '#7B89B8' }}>▾</span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 10 }}>
        {['25%', '50%', '75%', 'MAX'].map((p) => (
          <button
            key={p}
            style={{
              flex: 1,
              padding: '4px 0',
              borderRadius: 6,
              background: 'rgba(56, 189, 248, 0.08)',
              border: '1px solid rgba(56, 189, 248, 0.20)',
              color: '#38BDF8',
              fontSize: 10,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {p}
          </button>
        ))}
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
