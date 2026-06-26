'use client';

/**
 * H5 钱包总览页
 */
import { useState } from 'react';
import Link from 'next/link';
import {
  Wallet,
  ArrowDownToLine,
  ArrowUpFromLine,
  ArrowLeftRight,
  Eye,
  EyeOff,
  Clock,
  MapPin,
  ShieldCheck,
  ChevronRight,
  Copy,
} from 'lucide-react';
import { getAssets, getTotalAssetValue, getWalletTx } from '@/lib/h5-mock';

export default function H5WalletPage() {
  const [showBalance, setShowBalance] = useState(true);
  const total = getTotalAssetValue();
  const assets = getAssets();
  const txs = getWalletTx().slice(0, 3);

  return (
    <div style={{ padding: '12px' }}>
      {/* 资产总览卡 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 18,
          padding: 18,
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(30, 64, 175, 0.30), inset 0 1px 0 rgba(255,255,255,0.10)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: -30,
            right: -30,
            width: 140,
            height: 140,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.30) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -20,
            left: -20,
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240, 185, 11, 0.20) 0%, transparent 70%)',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, position: 'relative' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)' }}>钱包总资产 (USDT)</div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.70)', cursor: 'pointer', padding: 2, display: 'flex' }}
          >
            {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16, position: 'relative' }}>
          <span style={{ fontSize: 32, fontWeight: 800, color: '#fff', fontVariantNumeric: 'tabular-nums' }}>
            {showBalance ? total.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '****.****'}
          </span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>USDT</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, position: 'relative' }}>
          {[
            { icon: ArrowDownToLine, label: '充值', href: '/h5/wallet/deposit', color: '#38BDF8' },
            { icon: ArrowUpFromLine,  label: '提现', href: '/h5/wallet/withdraw', color: '#A78BFA' },
            { icon: ArrowLeftRight,   label: '划转', href: '/h5/wallet/transfer', color: '#F472B6' },
            { icon: Clock,            label: '历史', href: '/h5/wallet/history', color: '#FCD535' },
          ].map((btn) => {
            const Icon = btn.icon;
            return (
              <Link
                key={btn.label}
                href={btn.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  padding: '10px 0',
                  background: 'rgba(255,255,255,0.10)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 10,
                  color: '#fff',
                  fontSize: 12,
                  fontWeight: 600,
                  textDecoration: 'none',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <Icon size={14} color={btn.color} />
                {btn.label}
              </Link>
            );
          })}
        </div>
      </div>

      {/* 快捷入口 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {[
            { icon: MapPin, label: '地址', href: '/h5/wallet/address', color: '#38BDF8' },
            { icon: ShieldCheck, label: '安全', href: '/h5/wallet/security', color: '#34D399' },
            { icon: Wallet, label: '现货', href: '/h5/assets', color: '#FCD535' },
            { icon: ArrowLeftRight, label: '划转', href: '/h5/wallet/transfer', color: '#A78BFA' },
          ].map((entry) => {
            const Icon = entry.icon;
            return (
              <Link
                key={entry.label}
                href={entry.href}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '6px 0', textDecoration: 'none' }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    background: `${entry.color}26`,
                    border: `1px solid ${entry.color}40`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Icon size={20} color={entry.color} />
                </div>
                <span style={{ fontSize: 11, color: '#B4C0E0' }}>{entry.label}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* 资产列表 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
        <div style={{ width: 3, height: 14, borderRadius: 2, background: 'linear-gradient(180deg, #38BDF8 0%, #1E40AF 100%)', boxShadow: '0 0 6px rgba(56, 189, 248, 0.50)' }} />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>我的币种</span>
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          overflow: 'hidden',
          marginBottom: 12,
        }}
      >
        {assets.map((a, i) => (
          <div
            key={a.symbol}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 14,
              borderBottom: i < assets.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
              gap: 12,
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
                {showBalance ? a.value : '****'}
                <span style={{ fontSize: 10, color: '#7B89B8', marginLeft: 4 }}>USDT</span>
              </div>
              <div style={{ fontSize: 11, color: '#38BDF8', marginTop: 2 }}>{a.pct}%</div>
            </div>
          </div>
        ))}
      </div>

      {/* 最近交易 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderBottom: '1px solid rgba(148, 163, 184, 0.06)' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#F8FAFC' }}>最近交易</span>
          <Link href="/h5/wallet/history" style={{ fontSize: 12, color: '#7B89B8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2 }}>
            全部 <ChevronRight size={12} />
          </Link>
        </div>
        {txs.map((tx, i) => (
          <div
            key={tx.id}
            style={{
              display: 'flex', alignItems: 'center', padding: 12, gap: 10,
              borderBottom: i < txs.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
            }}
          >
            <div
              style={{
                width: 32, height: 32, borderRadius: 10,
                background: tx.type === 'deposit' || tx.type === 'transfer_in' ? 'rgba(52, 211, 153, 0.15)' : 'rgba(244, 114, 182, 0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              {tx.type === 'deposit' || tx.type === 'transfer_in'
                ? <ArrowDownToLine size={14} color="#34D399" />
                : <ArrowUpFromLine size={14} color="#F472B6" />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600 }}>
                {tx.type === 'deposit' && '充值'}
                {tx.type === 'withdraw' && '提现'}
                {tx.type === 'transfer_in' && '转入'}
                {tx.type === 'transfer_out' && '转出'} {tx.symbol}
              </div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{tx.time}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 13, color: tx.type.includes('in') || tx.type === 'deposit' ? '#34D399' : '#F472B6', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                {tx.amount}
              </div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>{tx.status === 'success' ? '成功' : '处理中'}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}