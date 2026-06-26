'use client';

/**
 * H5 资产页 v2 — 按截图风格重做
 */
import { useState } from 'react';
import { Eye, EyeOff, ArrowDownToLine, ArrowUpFromLine, ArrowLeftRight, Settings } from 'lucide-react';
import { getAssets, getTotalAssetValue } from '@/lib/h5-mock';

type Tab = 'all' | 'spot' | 'fund' | 'futures';

export default function H5Assets() {
  const [tab, setTab] = useState<Tab>('all');
  const [showBalance, setShowBalance] = useState(true);
  const totalValue = getTotalAssetValue();
  const todayPnl = 234.56;
  const assets = getAssets();

  return (
    <div style={{ padding: '12px' }}>
      {/* 资产总览卡 */}
      <div
        style={{
          background:
            'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 8,
            position: 'relative',
          }}
        >
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)' }}>总资产 (USDT)</div>
          <button
            onClick={() => setShowBalance(!showBalance)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'rgba(255,255,255,0.70)',
              cursor: 'pointer',
              padding: 2,
              display: 'flex',
            }}
            aria-label="显示/隐藏资产"
          >
            {showBalance ? <Eye size={16} /> : <EyeOff size={16} />}
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            marginBottom: 6,
            position: 'relative',
          }}
        >
          <span
            style={{
              fontSize: 32,
              fontWeight: 800,
              color: '#fff',
              letterSpacing: -0.5,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {showBalance
              ? totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 })
              : '****.****'}
          </span>
          <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.70)', fontWeight: 600 }}>
            USDT
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            marginBottom: 16,
            position: 'relative',
          }}
        >
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.60)' }}>今日盈亏</span>
          <span style={{ fontSize: 12, color: '#34D399', fontWeight: 600 }}>
            +{todayPnl.toFixed(2)} USDT
          </span>
        </div>

        {/* 4 个操作按钮 */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 8,
            position: 'relative',
          }}
        >
          {[
            { icon: ArrowDownToLine, label: '充值', color: '#38BDF8' },
            { icon: ArrowUpFromLine,  label: '提现', color: '#A78BFA' },
            { icon: ArrowLeftRight,   label: '划转', color: '#F472B6' },
            { icon: Settings,         label: '管理', color: '#FCD535' },
          ].map((btn) => {
            const Icon = btn.icon;
            return (
              <button
                key={btn.label}
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
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  WebkitBackdropFilter: 'blur(10px)',
                }}
              >
                <Icon size={14} color={btn.color} />
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 资产类型 Tab */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 12 }}>
        {[
          { k: 'all',     l: '全部' },
          { k: 'spot',    l: '现货' },
          { k: 'fund',    l: '理财' },
          { k: 'futures', l: '合约' },
        ].map((t) => {
          const active = t.k === tab;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k as Tab)}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                background: active ? 'rgba(56, 189, 248, 0.20)' : 'transparent',
                color: active ? '#38BDF8' : '#7B89B8',
                border: 'none',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
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
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        {assets.map((a, i) => (
          <div
            key={a.symbol}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: 14,
              borderBottom: i < assets.length - 1
                ? '1px solid rgba(148, 163, 184, 0.06)'
                : 'none',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#0F1B3D',
                flexShrink: 0,
              }}
            >
              {a.symbol.slice(0, 3)}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{a.symbol}</div>
              <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>
                {a.amount} {a.symbol}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 13,
                  color: '#F8FAFC',
                  fontWeight: 600,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {showBalance ? a.value : '****'}
                <span style={{ fontSize: 10, color: '#7B89B8', marginLeft: 4 }}>USDT</span>
              </div>
              <div style={{ fontSize: 11, color: '#38BDF8', marginTop: 2 }}>{a.pct}%</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}