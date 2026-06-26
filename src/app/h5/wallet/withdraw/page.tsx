'use client';

/**
 * H5 提现页
 */
import { useState } from 'react';
import { AlertCircle, ScanLine, Wallet } from 'lucide-react';
import { getAssets } from '@/lib/h5-mock';

export default function H5WithdrawPage() {
  const [selected, setSelected] = useState(getAssets()[2]);
  const [network, setNetwork] = useState('TRC20');
  const [address, setAddress] = useState('');
  const [amount, setAmount] = useState('');

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>数字资产提现</span>
      </div>

      {/* 币种选择 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 8 }}>提现币种</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {getAssets().slice(0, 5).map((a) => (
            <button
              key={a.symbol}
              onClick={() => setSelected(a)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: a.symbol === selected.symbol ? 'rgba(244, 114, 182, 0.20)' : 'rgba(148, 163, 184, 0.10)',
                border: a.symbol === selected.symbol ? '1px solid rgba(244, 114, 182, 0.40)' : '1px solid rgba(148, 163, 184, 0.18)',
                color: a.symbol === selected.symbol ? '#F472B6' : '#B4C0E0',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {a.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* 网络 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 8 }}>提现网络</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['TRC20', 'ERC20', 'BEP20'].map((n) => (
            <button
              key={n}
              onClick={() => setNetwork(n)}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                background: n === network ? 'rgba(244, 114, 182, 0.20)' : 'rgba(148, 163, 184, 0.10)',
                border: n === network ? '1px solid rgba(244, 114, 182, 0.40)' : '1px solid rgba(148, 163, 184, 0.18)',
                color: n === network ? '#F472B6' : '#B4C0E0',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* 提现地址 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 8 }}>提现地址</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            placeholder="请输入或粘贴提现地址"
            style={{
              flex: 1,
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
          >
            <ScanLine size={16} />
          </button>
        </div>
      </div>

      {/* 提现数量 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#7B89B8' }}>提现数量</span>
          <span style={{ fontSize: 11, color: '#7B89B8' }}>
            可用: <span style={{ color: '#FCD535' }}>{selected.amount} {selected.symbol}</span>
          </span>
        </div>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder={`最低 10 ${selected.symbol}`}
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
          {['25%', '50%', '75%', 'MAX'].map((p) => (
            <button
              key={p}
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
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* 手续费说明 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 12,
        }}
      >
        <RowItem label="网络手续费" value="1.00 USDT" />
        <RowItem label="预计到账" value="0.00 USDT" />
        <RowItem label="到账时间" value="约 5-10 分钟" />
      </div>

      {/* 提示 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(240, 185, 11, 0.10) 0%, rgba(21, 34, 74, 0.50) 100%)',
          border: '1px solid rgba(240, 185, 11, 0.25)',
          borderRadius: 12,
          padding: 12,
          marginBottom: 16,
          display: 'flex',
          gap: 10,
        }}
      >
        <AlertCircle size={16} color="#FCD535" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12, color: '#B4C0E0', lineHeight: 1.6 }}>
          请仔细核对提现地址,提现后无法找回。建议先小额测试。
        </div>
      </div>

      {/* 提交按钮 */}
      <button
        style={{
          width: '100%',
          padding: '14px 0',
          borderRadius: 12,
          border: 'none',
          background: 'linear-gradient(135deg, #F472B6 0%, #EF4444 100%)',
          color: '#fff',
          fontSize: 16,
          fontWeight: 700,
          cursor: 'pointer',
          boxShadow: '0 4px 16px rgba(244, 114, 182, 0.30)',
        }}
      >
        立即提现
      </button>

      <div style={{ height: 20 }} />
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