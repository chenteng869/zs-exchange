'use client';

/**
 * H5 合约资产页
 */
import { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Activity, AlertCircle } from 'lucide-react';
import { perpApi, type PerpPosition, type PerpAccount } from '@/lib/api/perp';

function h5Symbol(symbol: string) {
  if (symbol.endsWith('USDT')) return `${symbol.slice(0, -4)}/USDT`;
  return symbol;
}

function fmtNum(v: string | number, decimals = 2) {
  const n = Number(v);
  if (!Number.isFinite(n)) return '--';
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export default function H5FuturesPage() {
  const [positions, setPositions] = useState<PerpPosition[]>([]);
  const [account, setAccount] = useState<PerpAccount | null>(null);

  useEffect(() => {
    let alive = true;

    Promise.all([perpApi.getPositions(), perpApi.getAccount()])
      .then(([pos, acct]) => {
        if (!alive) return;
        setPositions(pos.positions ?? []);
        setAccount(acct);
      })
      .catch(() => {
        if (!alive) return;
      });

    return () => { alive = false; };
  }, []);

  const totalPnl = useMemo(
    () => positions.reduce((s, p) => s + Number(p.unrealizedPnl || 0), 0),
    [positions],
  );
  const totalMargin = useMemo(
    () => account ? Number(account.walletBalance || 0) : positions.reduce((s, p) => s + Number(p.margin || 0), 0),
    [positions, account],
  );

  return (
    <div style={{ padding: '12px' }}>
      {/* 合约总览 */}
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
            background: 'radial-gradient(circle, rgba(244, 114, 182, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Activity size={14} color="rgba(255,255,255,0.70)" />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.70)' }}>合约总资产 (USDT)</span>
          </div>
          <div
            style={{
              fontSize: 32, fontWeight: 800, color: '#fff',
              fontVariantNumeric: 'tabular-nums', marginBottom: 6,
            }}
          >
            {totalMargin.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 12,
              color: totalPnl >= 0 ? '#34D399' : '#F472B6',
            }}
          >
            {totalPnl >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>未实现盈亏: <span style={{ fontWeight: 700 }}>{totalPnl >= 0 ? '+' : ''}{totalPnl.toFixed(2)} USDT</span></span>
          </div>
        </div>
      </div>

      {/* 风险提示 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(244, 114, 182, 0.10) 0%, rgba(21, 34, 74, 0.50) 100%)',
          border: '1px solid rgba(244, 114, 182, 0.25)',
          borderRadius: 12, padding: 10, marginBottom: 12,
          display: 'flex', gap: 8,
        }}
      >
        <AlertCircle size={14} color="#F472B6" style={{ flexShrink: 0, marginTop: 2 }} />
        <span style={{ fontSize: 11, color: '#B4C0E0' }}>合约交易风险极高,请谨慎操作,建议使用止损</span>
      </div>

      {/* 当前持仓 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
        <div
          style={{
            width: 3, height: 14, borderRadius: 2,
            background: 'linear-gradient(180deg, #F472B6 0%, #EF4444 100%)',
            boxShadow: '0 0 6px rgba(244, 114, 182, 0.50)',
          }}
        />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>当前持仓</span>
        <span style={{ fontSize: 11, color: '#7B89B8', marginLeft: 4 }}>{positions.length} 笔</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {positions.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: '#7B89B8', fontSize: 12 }}>
            暂无持仓
          </div>
        )}
        {positions.map((p) => {
          const pnl = Number(p.unrealizedPnl || 0);
          const pnlPct = Number(p.unrealizedPnlPercent || 0);
          const isProfit = pnl >= 0;
          const pair = h5Symbol(p.symbol);
          const posQty = Number(p.positionQty || 0);
          const entryPrice = Number(p.entryPrice || 0);
          const size = posQty * entryPrice;
          return (
            <div
              key={p.id}
              style={{
                background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                border: `1px solid ${isProfit ? 'rgba(52, 211, 153, 0.20)' : 'rgba(244, 114, 182, 0.20)'}`,
                borderRadius: 16, padding: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span
                    style={{
                      fontSize: 10, padding: '2px 6px', borderRadius: 4,
                      background: p.side === 'long' ? 'rgba(52, 211, 153, 0.20)' : 'rgba(244, 114, 182, 0.20)',
                      color: p.side === 'long' ? '#34D399' : '#F472B6',
                      fontWeight: 700,
                    }}
                  >
                    {p.side === 'long' ? '做多' : '做空'} {p.leverage}x
                  </span>
                  <span style={{ fontSize: 13, color: '#F8FAFC', fontWeight: 600 }}>{pair}</span>
                </div>
                <div
                  style={{
                    fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums',
                    color: isProfit ? '#34D399' : '#F472B6',
                  }}
                >
                  {isProfit ? '+' : ''}{fmtNum(pnl)} <span style={{ fontSize: 11, fontWeight: 500 }}>{isProfit ? '+' : ''}{pnlPct.toFixed(2)}%</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                <Cell label="持仓价值" value={fmtNum(size)} />
                <Cell label="开仓价"   value={fmtNum(p.entryPrice)} />
                <Cell label="标记价"   value={fmtNum(p.markPrice)} />
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: '#7B89B8' }}>{label}</div>
      <div style={{ fontSize: 12, color: '#F8FAFC', fontWeight: 600, fontVariantNumeric: 'tabular-nums', marginTop: 2 }}>
        {value}
      </div>
    </div>
  );
}