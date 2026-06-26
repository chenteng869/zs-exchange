'use client';

import Link from 'next/link';
import {
  Coins,
  TrendingUp,
  Layers,
  Droplets,
  Sprout,
  Repeat,
  ChevronRight,
  Wallet,
  PiggyBank,
  Percent,
} from 'lucide-react';

export default function H5DefiEarnPage() {
  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>DeFi 理财</span>
      </div>

      {/* 资产总览卡 */}
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
            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.70)' }}>DeFi 总资产 (USD)</div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: '#FCD535',
              marginTop: 4,
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            $42,586.40
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
            <MiniStat label="累计收益" value="+$4,789.39" color="#34D399" />
            <MiniStat label="平均 APY" value="11.85%" color="#F0B90B" />
            <MiniStat label="活跃仓位" value="4" color="#38BDF8" />
          </div>
        </div>
      </div>

      {/* 4 宫格入口 */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 8,
          marginBottom: 14,
        }}
      >
        {[
          { icon: Droplets, label: '流动性池', color: '#38BDF8', href: '/h5/defi/pools' },
          { icon: Repeat,    label: '代币兑换', color: '#A78BFA', href: '/h5/defi/swap' },
          { icon: Sprout,    label: '流动性挖矿', color: '#34D399', href: '/h5/defi/farm' },
          { icon: Coins,     label: '单币质押', color: '#F0B90B', href: '/h5/defi/stake' },
        ].map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.label}
              href={it.href}
              style={{
                padding: 12,
                background:
                  'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: 14,
                textAlign: 'center',
                textDecoration: 'none',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: `${it.color}26`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 6px',
                }}
              >
                <Icon size={20} color={it.color} />
              </div>
              <div style={{ fontSize: 11, color: '#F8FAFC', fontWeight: 600 }}>{it.label}</div>
            </Link>
          );
        })}
      </div>

      {/* 我的持仓 */}
      <SectionTitle title="我的 DeFi 持仓" right={{ label: '全部', href: '/h5/defi/positions' }} />
      <Link
        href="/h5/defi/positions"
        style={{
          display: 'block',
          background:
            'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
          textDecoration: 'none',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Layers size={20} color="#0F1B3D" />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>SOL 质押池</div>
            <div style={{ fontSize: 11, color: '#7B89B8' }}>已持仓 45 天 · APY 18.7%</div>
          </div>
          <ChevronRight size={16} color="#7B89B8" />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: 8,
          }}
        >
          <MiniStat label="持仓价值" value="$23,432" inline />
          <MiniStat label="累计收益" value="+$3,452" color="#34D399" inline />
          <MiniStat label="收益率" value="+17.28%" color="#34D399" inline />
        </div>
      </Link>

      {/* 热门池子 */}
      <SectionTitle title="热门流动性池" right={{ label: '查看全部', href: '/h5/defi/pools' }} />
      <PoolRow rank={1} name="BTC-ETH" apy="12.5%" tvl="$4.2M" vol="$890K" risk="low" color="#F0B90B" />
      <PoolRow rank={2} name="USDT-USDC" apy="8.2%"  tvl="$6.8M" vol="$1.2M" risk="low" color="#38BDF8" />
      <PoolRow rank={3} name="SOL 单币"  apy="18.7%" tvl="$2.1M" vol="$345K" risk="mid" color="#A78BFA" />

      {/* 推荐入口 */}
      <SectionTitle title="更多 DeFi 服务" />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8,
        }}
      >
        {[
          { icon: PiggyBank, title: '活期理财', sub: '随存随取 4.5%', color: '#F0B90B', href: '/h5/savings/flexible' },
          { icon: Percent,   title: '定期理财', sub: '锁仓 30 天 6.8%', color: '#34D399', href: '/h5/savings/fixed' },
          { icon: TrendingUp,title: '收益历史', sub: '查看挖矿明细', color: '#38BDF8', href: '/h5/defi/history' },
          { icon: Wallet,    title: '链上钱包', sub: 'WEB3 资产管理', color: '#A78BFA', href: '/h5/wallet' },
        ].map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.title}
              href={it.href}
              style={{
                padding: 12,
                background:
                  'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
                border: '1px solid rgba(148, 163, 184, 0.12)',
                borderRadius: 14,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: `${it.color}26`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Icon size={16} color={it.color} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#F8FAFC' }}>{it.title}</div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 1 }}>{it.sub}</div>
              </div>
            </Link>
          );
        })}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}

function MiniStat({
  label,
  value,
  color,
  inline,
}: {
  label: string;
  value: string;
  color?: string;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <div>
        <div style={{ fontSize: 9, color: '#7B89B8' }}>{label}</div>
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
  return (
    <div>
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>{label}</div>
      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
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

function SectionTitle({
  title,
  right,
}: {
  title: string;
  right?: { label: string; href: string };
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        margin: '4px 4px 8px',
      }}
    >
      <div style={{ width: 3, height: 12, background: '#F0B90B', borderRadius: 2 }} />
      <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{title}</span>
      {right && (
        <Link
          href={right.href}
          style={{
            marginLeft: 'auto',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            color: '#7B89B8',
            fontSize: 11,
            textDecoration: 'none',
          }}
        >
          {right.label} <ChevronRight size={12} />
        </Link>
      )}
    </div>
  );
}

function PoolRow({
  rank,
  name,
  apy,
  tvl,
  vol,
  risk,
  color,
}: {
  rank: number;
  name: string;
  apy: string;
  tvl: string;
  vol: string;
  risk: 'low' | 'mid' | 'high';
  color: string;
}) {
  return (
    <Link
      href={`/h5/defi/pool/POOL-00${rank}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '12px 14px',
        background:
          'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
        border: '1px solid rgba(148, 163, 184, 0.12)',
        borderRadius: 14,
        marginBottom: 8,
        textDecoration: 'none',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: `${color}26`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 14,
          fontWeight: 800,
          color,
        }}
      >
        {rank}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>{name}</span>
          <span
            style={{
              fontSize: 9,
              padding: '1px 5px',
              borderRadius: 3,
              background:
                risk === 'low'
                  ? 'rgba(52, 211, 153, 0.20)'
                  : risk === 'mid'
                  ? 'rgba(240, 185, 11, 0.20)'
                  : 'rgba(244, 114, 182, 0.20)',
              color: risk === 'low' ? '#34D399' : risk === 'mid' ? '#F0B90B' : '#F472B6',
              fontWeight: 700,
            }}
          >
            {risk === 'low' ? '低风险' : risk === 'mid' ? '中风险' : '高风险'}
          </span>
        </div>
        <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>
          TVL {tvl} · 24h 量 {vol}
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#34D399', fontVariantNumeric: 'tabular-nums' }}>
          {apy}
        </div>
        <div style={{ fontSize: 9, color: '#7B89B8' }}>APY</div>
      </div>
    </Link>
  );
}
