'use client';

/**
 * H5 充值页
 */
import { useState } from 'react';
import { ChevronLeft, Copy, QrCode, Check, AlertCircle } from 'lucide-react';
import { getAssets } from '@/lib/h5-mock';

export default function H5DepositPage() {
  const [selected, setSelected] = useState(getAssets()[2]); // USDT default
  const [network, setNetwork] = useState('TRC20');

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题栏 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>数字资产充值</span>
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
        <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 8 }}>充值币种</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {getAssets().map((a) => (
            <button
              key={a.symbol}
              onClick={() => setSelected(a)}
              style={{
                padding: '8px 16px',
                borderRadius: 10,
                background: a.symbol === selected.symbol ? 'rgba(56, 189, 248, 0.20)' : 'rgba(148, 163, 184, 0.10)',
                border: a.symbol === selected.symbol ? '1px solid rgba(56, 189, 248, 0.40)' : '1px solid rgba(148, 163, 184, 0.18)',
                color: a.symbol === selected.symbol ? '#38BDF8' : '#B4C0E0',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {a.symbol}
            </button>
          ))}
        </div>
      </div>

      {/* 网络选择 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ fontSize: 12, color: '#7B89B8', marginBottom: 8 }}>选择网络</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {['TRC20', 'ERC20', 'BEP20'].map((n) => (
            <button
              key={n}
              onClick={() => setNetwork(n)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 10,
                background: n === network ? 'rgba(56, 189, 248, 0.20)' : 'rgba(148, 163, 184, 0.10)',
                border: n === network ? '1px solid rgba(56, 189, 248, 0.40)' : '1px solid rgba(148, 163, 184, 0.18)',
                color: n === network ? '#38BDF8' : '#B4C0E0',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* 二维码 + 地址 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 18,
          marginBottom: 12,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 14 }}>
          <div
            style={{
              width: 180,
              height: 180,
              margin: '0 auto',
              borderRadius: 12,
              background: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            <QrCode size={140} color="#0F1B3D" />
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: '#7B89B8' }}>
            请使用 {selected.symbol} ({network}) 钱包扫码充值
          </div>
        </div>

        <div
          style={{
            background: 'rgba(15, 27, 61, 0.50)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: 10,
            padding: 12,
          }}
        >
          <div style={{ fontSize: 11, color: '#7B89B8', marginBottom: 6 }}>充值地址</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                flex: 1,
                fontSize: 12,
                color: '#F8FAFC',
                fontFamily: 'monospace',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              TKzx9m8Fh4nKLr5Jh7pCxVcRqP3VYhM4Nx
            </span>
            <button
              style={{
                padding: '4px 10px',
                borderRadius: 6,
                background: 'rgba(56, 189, 248, 0.20)',
                border: '1px solid rgba(56, 189, 248, 0.30)',
                color: '#38BDF8',
                fontSize: 11,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                flexShrink: 0,
              }}
            >
              <Copy size={11} /> 复制
            </button>
          </div>
        </div>
      </div>

      {/* 提示 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(240, 185, 11, 0.10) 0%, rgba(21, 34, 74, 0.50) 100%)',
          border: '1px solid rgba(240, 185, 11, 0.25)',
          borderRadius: 12,
          padding: 12,
          display: 'flex',
          gap: 10,
        }}
      >
        <AlertCircle size={16} color="#FCD535" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 12, color: '#B4C0E0', lineHeight: 1.6 }}>
          <div style={{ color: '#FCD535', fontWeight: 600, marginBottom: 4 }}>充值须知</div>
          1. 仅支持 {selected.symbol} ({network}) 充值至该地址<br />
          2. 最小充值数量: 10 {selected.symbol}<br />
          3. 充值到账时间: 1-5 分钟<br />
          4. 请勿向该地址充值任何非 {selected.symbol} 资产
        </div>
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}