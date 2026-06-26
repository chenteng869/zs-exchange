'use client';

import Link from 'next/link';
import { Coins, TrendingUp, Lock, ChevronRight, AlertCircle, ShieldCheck } from 'lucide-react';
import { getStakePools } from '@/lib/h5-mock';

const RISK_COLORS = { low: '#34D399', mid: '#F0B90B', high: '#F472B6' };
const RISK_TEXT   = { low: '低风险',   mid: '中风险',   high: '高风险' };

export default function H5StakeListPage() {
  const pools = getStakePools();
  const activeCount = pools.filter((p) => p.status === 'active').length;

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>PoS 质押</span>
        <span style={{ fontSize: 11, color: '#7B89B8', marginLeft: 'auto' }}>
          {activeCount} 个可用
        </span>
      </div>

      {/* 总览 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 18,
          padding: 18,
          marginBottom: 12,
          position: 'relative',
          overflow: 'hidden',
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
            background: 'radial-gradient(circle, rgba(240, 185, 11, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <ShieldCheck size={14} color="#FCD535" />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)' }}>PoS 共识挖矿 · 安全保障</span>
          </div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#F8FAFC',
              lineHeight: 1.4,
            }}
          >
            持币生息
            <span style={{ color: '#FCD535' }}> 0 风险 </span>
            最高年化 18.7%
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <Mini label="全网质押"  value="$258.4M" />
            <Mini label="平均 APY"  value="7.85%" color="#34D399" />
            <Mini label="我的收益"  value="+$345.20" color="#FCD535" />
          </div>
        </div>
      </div>

      {/* 列表 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 4px 8px' }}>
        <div style={{ width: 3, height: 12, background: '#F0B90B', borderRadius: 2 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>全部质押池</span>
      </div>

      {pools.map((p, i) => {
        const color = RISK_COLORS[p.riskLevel];
        const paused = p.status === 'paused';
        return (
          <Link
            key={p.id}
            href={paused ? '#' : `/h5/stake/detail/${p.id}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 14,
              background:
                'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: '1px solid rgba(148, 163, 184, 0.12)',
              borderRadius: 16,
              marginBottom: 10,
              textDecoration: 'none',
              opacity: paused ? 0.6 : 1,
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                fontWeight: 800,
                color: '#fff',
              }}
            >
              {p.icon}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>
                  {p.symbol}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    padding: '1px 5px',
                    borderRadius: 3,
                    background: `${color}26`,
                    color,
                    fontWeight: 700,
                  }}
                >
                  {RISK_TEXT[p.riskLevel]}
                </span>
                {paused && (
                  <span
                    style={{
                      fontSize: 9,
                      padding: '1px 5px',
                      borderRadius: 3,
                      background: 'rgba(244, 114, 182, 0.20)',
                      color: '#F472B6',
                      fontWeight: 700,
                    }}
                  >
                    暂停
                  </span>
                )}
              </div>
              <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>
                {p.name} · {p.network}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <Lock size={10} color="#7B89B8" />
                <span style={{ fontSize: 10, color: '#7B89B8' }}>
                  {p.lockDays === 0 ? '随存随取' : `${p.lockDays} 天锁仓`}
                </span>
                <span style={{ fontSize: 10, color: '#7B89B8' }}>·</span>
                <span style={{ fontSize: 10, color: '#7B89B8' }}>TVL {p.totalStaked}</span>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontSize: 16,
                  fontWeight: 800,
                  color: paused ? '#7B89B8' : '#34D399',
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {p.apy}
              </div>
              <div style={{ fontSize: 9, color: '#7B89B8' }}>APY</div>
            </div>
            <ChevronRight size={14} color="#7B89B8" />
          </Link>
        );
      })}

      <div
        style={{
          marginTop: 12,
          padding: 12,
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.20)',
          borderRadius: 12,
          display: 'flex',
          gap: 8,
        }}
      >
        <AlertCircle size={14} color="#38BDF8" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.6 }}>
          PoS 质押通过节点验证交易保障网络安全，收益来自链上增发与交易费分成，本金不参与做市。
        </div>
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function Mini({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>{label}</div>
      <div
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: color || '#F8FAFC',
          marginTop: 2,
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </div>
    </div>
  );
}
