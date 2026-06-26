'use client';

/**
 * H5 资产管理页（汇总管理）
 */
import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Wallet, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Settings } from 'lucide-react';
import { getAssets, getTotalAssetValue } from '@/lib/h5-mock';

export default function H5ManagePage() {
  const [tab, setTab] = useState('overview');
  const total = getTotalAssetValue();
  const assets = getAssets();

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>资产管理</span>
        <button
          style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'rgba(148, 163, 184, 0.10)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            color: '#B4C0E0', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Settings size={14} />
        </button>
      </div>

      {/* 总资产卡 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 18, padding: 18, marginBottom: 12,
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)', marginBottom: 4 }}>全部资产 (USDT)</div>
          <div
            style={{
              fontSize: 30, fontWeight: 800, color: '#fff',
              fontVariantNumeric: 'tabular-nums', marginBottom: 4,
            }}
          >
            {total.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.60)' }}>≈ ${(total * 1).toFixed(2)} USD</div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 14 }}>
            <div
              style={{
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>现货</div>
              <div style={{ fontSize: 14, color: '#fff', fontWeight: 600, marginTop: 2 }}>¥{(total * 0.7).toFixed(0)}</div>
            </div>
            <div
              style={{
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>理财</div>
              <div style={{ fontSize: 14, color: '#FCD535', fontWeight: 600, marginTop: 2 }}>¥{(total * 0.2).toFixed(0)}</div>
            </div>
            <div
              style={{
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.10)',
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>合约</div>
              <div style={{ fontSize: 14, color: '#F472B6', fontWeight: 600, marginTop: 2 }}>¥{(total * 0.1).toFixed(0)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* 快捷操作 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16, padding: 14, marginBottom: 12,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { icon: ArrowDownToLine, label: '充值', href: '/h5/wallet/deposit', color: '#38BDF8' },
            { icon: ArrowUpFromLine,  label: '提现', href: '/h5/wallet/withdraw', color: '#A78BFA' },
            { icon: ArrowLeftRight,   label: '划转', href: '/h5/wallet/transfer', color: '#F472B6' },
            { icon: Wallet,           label: '钱包', href: '/h5/wallet', color: '#FCD535' },
          ].map((btn) => {
            const Icon = btn.icon;
            return (
              <Link
                key={btn.label}
                href={btn.href}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '8px 0', textDecoration: 'none',
                }}
              >
                <div
                  style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `${btn.color}26`, border: `1px solid ${btn.color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <Icon size={16} color={btn.color} />
                </div>
                <span style={{ fontSize: 11, color: '#B4C0E0' }}>{btn.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 资产 Tab */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12, background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, padding: 4 }}>
        {[
          { k: 'overview', l: '概览' },
          { k: 'detail',   l: '明细' },
        ].map((t) => {
          const active = t.k === tab;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: 8,
                background: active ? 'rgba(56, 189, 248, 0.20)' : 'transparent',
                color: active ? '#38BDF8' : '#7B89B8',
                border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {t.l}
            </button>
          );
        })}
      </div>

      {/* 资产列表 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16, overflow: 'hidden',
        }}
      >
        {assets.map((a, i) => (
          <div
            key={a.symbol}
            style={{
              display: 'flex', alignItems: 'center', padding: 14, gap: 12,
              borderBottom: i < assets.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
            }}
          >
            <div
              style={{
                width: 36, height: 36, borderRadius: 18,
                background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, fontWeight: 700, color: '#0F1B3D',
                flexShrink: 0,
              }}
            >
              {a.symbol.slice(0, 3)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{a.symbol}</div>
              <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>{a.amount} {a.symbol}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {a.value}
                <span style={{ fontSize: 10, color: '#7B89B8', marginLeft: 4 }}>USDT</span>
              </div>
              <div style={{ fontSize: 11, color: '#38BDF8', marginTop: 2 }}>{a.pct}%</div>
            </div>
            <ChevronRight size={14} color="#7B89B8" />
          </div>
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}