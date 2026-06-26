'use client';

import { useState } from 'react';
import {
  Wallet,
  Lock,
  Calendar,
  TrendingUp,
  Percent,
  CheckCircle2,
  Info,
  Sparkles,
  PiggyBank,
  AlertCircle,
} from 'lucide-react';
import { getSavingsProducts } from '@/lib/h5-mock';

export default function H5SavingsFixedPage() {
  const products = getSavingsProducts().filter((p) => p.type === 'fixed');
  const [selected, setSelected] = useState(products[0].id);
  const sp = products.find((p) => p.id === selected)!;
  const [amount, setAmount] = useState('1000.00');

  const apyNum = parseFloat(sp.apy);
  const reward = ((parseFloat(amount) * apyNum / 100 * (sp.duration || 30)) / 365).toFixed(2);

  return (
    <div style={{ padding: '12px' }}>
      {/* 标题 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 3, height: 16, background: '#38BDF8', borderRadius: 2 }} />
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>定期理财</span>
        <span
          style={{
            fontSize: 10,
            padding: '2px 8px',
            borderRadius: 4,
            background: 'rgba(240, 185, 11, 0.20)',
            color: '#F0B90B',
            fontWeight: 700,
            marginLeft: 'auto',
          }}
        >
          最高 15.8%
        </span>
      </div>

      {/* Banner */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(240, 185, 11, 0.18) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(240, 185, 11, 0.30)',
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
            background: 'radial-gradient(circle, rgba(252, 213, 53, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
            <Sparkles size={14} color="#FCD535" />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.80)' }}>限时加息</span>
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#F8FAFC',
              lineHeight: 1.4,
            }}
          >
            锁仓 30/90/180 天
            <span style={{ color: '#FCD535' }}> 年化最高 12.5%</span>
          </div>
          <div style={{ display: 'flex', gap: 16, marginTop: 10 }}>
            <Mini label="定期总规模" value="$45.2M" />
            <Mini label="购买人次"   value="8,234" />
            <Mini label="累计派息"   value="$1.2M" color="#34D399" />
          </div>
        </div>
      </div>

      {/* 产品列表 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '4px 4px 8px' }}>
        <div style={{ width: 3, height: 12, background: '#F0B90B', borderRadius: 2 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>定期产品</span>
      </div>

      {products.map((p) => {
        const active = p.id === selected;
        const soldOut = p.status === 'soldout';
        const progress = parseFloat(p.sold.replace('%', '')) || 50;
        return (
          <div
            key={p.id}
            onClick={() => !soldOut && setSelected(p.id)}
            style={{
              padding: 14,
              background: active
                ? 'linear-gradient(180deg, rgba(240, 185, 11, 0.18) 0%, rgba(21, 34, 74, 0.70) 100%)'
                : 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: `1px solid ${active ? 'rgba(240, 185, 11, 0.40)' : 'rgba(148, 163, 184, 0.12)'}`,
              borderRadius: 14,
              marginBottom: 8,
              cursor: soldOut ? 'not-allowed' : 'pointer',
              opacity: soldOut ? 0.6 : 1,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {soldOut && (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  fontSize: 9,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: 'rgba(244, 114, 182, 0.20)',
                  color: '#F472B6',
                  fontWeight: 700,
                }}
              >
                已售罄
              </div>
            )}
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
                  fontSize: 14,
                  fontWeight: 800,
                  color: '#0F1B3D',
                }}
              >
                {p.symbol.charAt(0)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{p.name}</span>
                </div>
                <div style={{ fontSize: 10, color: '#7B89B8', marginTop: 2 }}>
                  <Lock size={10} color="#7B89B8" style={{ display: 'inline-block', verticalAlign: 'middle' }} /> {p.duration} 天锁仓
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#FCD535' }}>{p.apy}</div>
                <div style={{ fontSize: 9, color: '#7B89B8' }}>年化 APY</div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
              <div
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  background: 'rgba(15, 27, 61, 0.40)',
                  borderRadius: 8,
                }}
              >
                <div style={{ fontSize: 9, color: '#7B89B8' }}>基础</div>
                <div style={{ fontSize: 12, color: '#B4C0E0', fontWeight: 600 }}>{p.baseApy}</div>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  background: 'rgba(240, 185, 11, 0.10)',
                  borderRadius: 8,
                }}
              >
                <div style={{ fontSize: 9, color: '#F0B90B' }}>加息</div>
                <div style={{ fontSize: 12, color: '#FCD535', fontWeight: 700 }}>{p.bonusApy}</div>
              </div>
              <div
                style={{
                  flex: 1,
                  padding: '6px 10px',
                  background: 'rgba(15, 27, 61, 0.40)',
                  borderRadius: 8,
                }}
              >
                <div style={{ fontSize: 9, color: '#7B89B8' }}>起存</div>
                <div style={{ fontSize: 12, color: '#B4C0E0', fontWeight: 600 }}>{p.minAmount}</div>
              </div>
            </div>

            {/* 进度 */}
            <div style={{ position: 'relative', height: 4, background: 'rgba(148, 163, 184, 0.20)', borderRadius: 2, marginBottom: 6 }}>
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  height: '100%',
                  width: `${progress}%`,
                  background: 'linear-gradient(90deg, #F0B90B 0%, #FCD535 100%)',
                  borderRadius: 2,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: '#7B89B8' }}>
              <span>已售 {p.sold}</span>
              <span>总额 {p.totalQuota}</span>
            </div>
          </div>
        );
      })}

      {/* 申购 */}
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
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 11, color: '#7B89B8' }}>申购金额</span>
          <span style={{ fontSize: 11, color: '#7B89B8', display: 'flex', alignItems: 'center', gap: 3 }}>
            <Wallet size={11} /> 余额 32,456.78 {sp.symbol}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: '#F8FAFC',
              fontSize: 24,
              fontWeight: 700,
              fontFamily: 'inherit',
              fontVariantNumeric: 'tabular-nums',
            }}
          />
          <span style={{ fontSize: 14, fontWeight: 700, color: '#F8FAFC' }}>{sp.symbol}</span>
        </div>
      </div>

      {/* 收益 */}
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(240, 185, 11, 0.15) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(240, 185, 11, 0.30)',
          borderRadius: 16,
          padding: 14,
          marginBottom: 12,
        }}
      >
        <InfoRow label="预计年收益"   value={((parseFloat(amount) * apyNum) / 100).toFixed(2) + ' ' + sp.symbol} color="#34D399" />
        <InfoRow label={`预计${sp.duration}天收益`} value={reward + ' ' + sp.symbol} color="#FCD535" />
        <InfoRow label="起息时间"     value="次日 00:00" />
        <InfoRow label="到期日"       value={new Date(Date.now() + (sp.duration || 30) * 86400 * 1000).toISOString().slice(0, 10)} last />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          padding: 12,
          background: 'rgba(240, 185, 11, 0.10)',
          border: '1px solid rgba(240, 185, 11, 0.25)',
          borderRadius: 12,
          marginBottom: 12,
        }}
      >
        <AlertCircle size={14} color="#F0B90B" style={{ flexShrink: 0, marginTop: 2 }} />
        <div style={{ fontSize: 11, color: '#B4C0E0', lineHeight: 1.6 }}>
          定期理财锁仓期间不可提前赎回，到期自动续期或转活期；本金保本保息。
        </div>
      </div>

      <button
        style={{
          width: '100%',
          padding: '14px 0',
          background: sp.status === 'soldout'
            ? 'rgba(148, 163, 184, 0.20)'
            : 'linear-gradient(135deg, #F0B90B 0%, #FCD535 100%)',
          color: sp.status === 'soldout' ? '#7B89B8' : '#0F1B3D',
          fontSize: 15,
          fontWeight: 800,
          border: 'none',
          borderRadius: 14,
          cursor: sp.status === 'soldout' ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          boxShadow: sp.status === 'soldout' ? 'none' : '0 4px 16px rgba(240, 185, 11, 0.30)',
        }}
      >
        <CheckCircle2 size={16} strokeWidth={2.5} /> {sp.status === 'soldout' ? '已售罄' : '立即申购'}
      </button>

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
