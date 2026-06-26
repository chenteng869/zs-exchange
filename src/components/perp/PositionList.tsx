'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown, AlertTriangle, Shield, DollarSign, Percent } from 'lucide-react';

interface Position {
  id: string;
  symbol: string;
  side: 'long' | 'short';
  marginMode: 'isolated' | 'cross';
  size: string;
  entryPrice: string;
  markPrice: string;
  liquidationPrice: string;
  leverage: number;
  margin: string;
  unrealizedPnl: string;
  unrealizedPnlRate: string;
  marginRatio: string;
  riskLevel: string;
  positionValue: string;
  maintenanceMargin: string;
  createdAt: number;
}

interface PositionListProps {
  positions?: Position[];
  onClose?: (positionId: string) => void;
  onAddMargin?: (positionId: string, amount: string) => void;
  onReduceMargin?: (positionId: string, amount: string) => void;
  onAdjustLeverage?: (positionId: string, leverage: number) => void;
  loading?: boolean;
}

export default function PositionList({
  positions = defaultPositions,
  onClose,
  onAddMargin,
  onReduceMargin,
  onAdjustLeverage,
  loading = false,
}: PositionListProps) {
  const [filter, setFilter] = useState<'all' | 'isolated' | 'cross'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredPositions = useMemo(() => {
    if (filter === 'all') return positions;
    return positions.filter(p => p.marginMode === filter);
  }, [positions, filter]);

  const totalStats = useMemo(() => {
    const totalPnl = positions.reduce((sum, p) => sum + parseFloat(p.unrealizedPnl), 0);
    const totalMargin = positions.reduce((sum, p) => sum + parseFloat(p.margin), 0);
    const totalValue = positions.reduce((sum, p) => sum + parseFloat(p.positionValue), 0);
    return {
      totalPnl: totalPnl.toFixed(2),
      totalMargin: totalMargin.toFixed(2),
      totalValue: totalValue.toFixed(2),
      pnlRate: totalMargin > 0 ? ((totalPnl / totalMargin) * 100).toFixed(2) : '0',
    };
  }, [positions]);

  const getRiskBadge = (level: string) => {
    const colors: Record<string, { bg: string; text: string; label: string }> = {
      safe: { bg: 'rgba(16, 185, 129, 0.15)', text: '#10B981', label: '安全' },
      low: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3B82F6', label: '低风险' },
      medium: { bg: 'rgba(245, 158, 11, 0.15)', text: '#F59E0B', label: '中风险' },
      high: { bg: 'rgba(239, 68, 68, 0.15)', text: '#EF4444', label: '高风险' },
      dangerous: { bg: 'rgba(239, 68, 68, 0.3)', text: '#EF4444', label: '危险' },
    };
    const c = colors[level] || colors.safe;
    return (
      <span
        style={{
          padding: '2px 8px',
          borderRadius: 4,
          background: c.bg,
          color: c.text,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        {c.label}
      </span>
    );
  };

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)',
        border: '1px solid rgba(71, 85, 105, 0.4)',
        borderRadius: 12,
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ margin: 0, color: '#F8FAFC', fontSize: 16, fontWeight: 600 }}>
          我的持仓
        </h3>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ color: '#94A3B8', fontSize: 12 }}>共 {positions.length} 个</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 16 }}>
        <StatCard label="未实现盈亏" value={`$${totalStats.totalPnl}`} positive={parseFloat(totalStats.totalPnl) >= 0} />
        <StatCard label="收益率" value={`${totalStats.pnlRate}%`} positive={parseFloat(totalStats.pnlRate) >= 0} />
        <StatCard label="占用保证金" value={`$${totalStats.totalMargin}`} icon={<DollarSign size={14} />} />
        <StatCard label="持仓价值" value={`$${totalStats.totalValue}`} icon={<TrendingUp size={14} />} />
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {(['all', 'isolated', 'cross'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '6px 16px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              background: filter === f ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.1)',
              color: filter === f ? '#3B82F6' : '#94A3B8',
              fontWeight: filter === f ? 600 : 400,
            }}
          >
            {f === 'all' ? '全部' : f === 'isolated' ? '逐仓' : '全仓'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>加载中...</div>
      ) : filteredPositions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#64748B' }}>
          <Shield size={40} style={{ marginBottom: 12, opacity: 0.3 }} />
          <p>暂无持仓</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredPositions.map(position => (
            <PositionCard
              key={position.id}
              position={position}
              isExpanded={selectedId === position.id}
              onToggle={() => setSelectedId(selectedId === position.id ? null : position.id)}
              onClose={onClose}
              onAddMargin={onAddMargin}
              onReduceMargin={onReduceMargin}
              onAdjustLeverage={onAdjustLeverage}
              riskBadge={getRiskBadge(position.riskLevel)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  positive,
  icon,
}: {
  label: string;
  value: string;
  positive?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 8,
        padding: 12,
        border: '1px solid rgba(71, 85, 105, 0.3)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {icon && <span style={{ color: '#64748B' }}>{icon}</span>}
        <span style={{ color: '#94A3B8', fontSize: 12 }}>{label}</span>
      </div>
      <span
        style={{
          color: positive !== undefined ? (positive ? '#10B981' : '#EF4444') : '#F8FAFC',
          fontSize: 18,
          fontWeight: 700,
        }}
      >
        {value}
      </span>
    </div>
  );
}

function PositionCard({
  position,
  isExpanded,
  onToggle,
  onClose,
  onAddMargin,
  onReduceMargin,
  onAdjustLeverage,
  riskBadge,
}: {
  position: Position;
  isExpanded: boolean;
  onToggle: () => void;
  onClose?: (id: string) => void;
  onAddMargin?: (id: string, amount: string) => void;
  onReduceMargin?: (id: string, amount: string) => void;
  onAdjustLeverage?: (id: string, leverage: number) => void;
  riskBadge: React.ReactNode;
}) {
  const pnlPositive = parseFloat(position.unrealizedPnl) >= 0;
  const [marginInput, setMarginInput] = useState('');
  const [leverageInput, setLeverageInput] = useState(String(position.leverage));

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        borderRadius: 10,
        border: '1px solid rgba(71, 85, 105, 0.3)',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={onToggle}
        style={{
          padding: 14,
          cursor: 'pointer',
          display: 'grid',
          gridTemplateColumns: '2fr 1.5fr 1.5fr 1.5fr 1fr',
          gap: 12,
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span style={{ color: '#F8FAFC', fontWeight: 600, fontSize: 14 }}>{position.symbol}</span>
            <span
              style={{
                padding: '2px 6px',
                borderRadius: 4,
                fontSize: 11,
                fontWeight: 700,
                background: position.side === 'long' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                color: position.side === 'long' ? '#10B981' : '#EF4444',
              }}
            >
              {position.side === 'long' ? '多' : '空'} {position.leverage}x
            </span>
            <span style={{ color: '#64748B', fontSize: 11 }}>
              {position.marginMode === 'isolated' ? '逐仓' : '全仓'}
            </span>
          </div>
          <div style={{ color: '#64748B', fontSize: 12 }}>
            数量: {position.size}
          </div>
        </div>

        <div>
          <div style={{ color: '#64748B', fontSize: 11, marginBottom: 2 }}>开仓价</div>
          <div style={{ color: '#F8FAFC', fontSize: 13, fontWeight: 500 }}>${position.entryPrice}</div>
        </div>

        <div>
          <div style={{ color: '#64748B', fontSize: 11, marginBottom: 2 }}>标记价格</div>
          <div style={{ color: pnlPositive ? '#10B981' : '#EF4444', fontSize: 13, fontWeight: 500 }}>
            ${position.markPrice}
          </div>
        </div>

        <div>
          <div style={{ color: '#64748B', fontSize: 11, marginBottom: 2 }}>未实现盈亏</div>
          <div style={{ color: pnlPositive ? '#10B981' : '#EF4444', fontSize: 14, fontWeight: 700 }}>
            {pnlPositive ? '+' : ''}{position.unrealizedPnl}
            <span style={{ fontSize: 11, fontWeight: 400, marginLeft: 4 }}>
              ({pnlPositive ? '+' : ''}{position.unrealizedPnlRate}%)
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {riskBadge}
        </div>
      </div>

      {isExpanded && (
        <div style={{ padding: '0 14px 14px', borderTop: '1px solid rgba(71, 85, 105, 0.3)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, padding: '12px 0' }}>
            <DetailItem label="强平价" value={`$${position.liquidationPrice}`} warn={true} />
            <DetailItem label="保证金" value={`$${position.margin}`} />
            <DetailItem label="维持保证金" value={`$${position.maintenanceMargin}`} />
            <DetailItem label="保证金率" value={`${(parseFloat(position.marginRatio) * 100).toFixed(2)}%`} />
            <DetailItem label="持仓价值" value={`$${position.positionValue}`} />
            <DetailItem label="保证金模式" value={position.marginMode === 'isolated' ? '逐仓' : '全仓'} />
            <DetailItem label="杠杆倍数" value={`${position.leverage}x`} />
            <DetailItem label="开仓时间" value={new Date(position.createdAt).toLocaleDateString()} />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', paddingTop: 12, borderTop: '1px solid rgba(71, 85, 105, 0.3)' }}>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="number"
                value={marginInput}
                onChange={e => setMarginInput(e.target.value)}
                placeholder="保证金数量"
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(71, 85, 105, 0.5)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#F8FAFC',
                  fontSize: 12,
                  width: 100,
                }}
              />
              <button
                onClick={() => onAddMargin && onAddMargin(position.id, marginInput)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'rgba(16, 185, 129, 0.2)',
                  color: '#10B981',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                增加保证金
              </button>
              <button
                onClick={() => onReduceMargin && onReduceMargin(position.id, marginInput)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#F59E0B',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                减少保证金
              </button>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="number"
                value={leverageInput}
                onChange={e => setLeverageInput(e.target.value)}
                min="1"
                max="125"
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: '1px solid rgba(71, 85, 105, 0.5)',
                  background: 'rgba(15, 23, 42, 0.8)',
                  color: '#F8FAFC',
                  fontSize: 12,
                  width: 60,
                }}
              />
              <button
                onClick={() => onAdjustLeverage && onAdjustLeverage(position.id, parseInt(leverageInput))}
                style={{
                  padding: '6px 12px',
                  borderRadius: 6,
                  border: 'none',
                  background: 'rgba(59, 130, 246, 0.2)',
                  color: '#3B82F6',
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 500,
                }}
              >
                调整杠杆
              </button>
            </div>

            <button
              onClick={() => onClose && onClose(position.id)}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                background: 'rgba(239, 68, 68, 0.2)',
                color: '#EF4444',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 600,
                marginLeft: 'auto',
              }}
            >
              平仓
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailItem({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div>
      <div style={{ color: '#64748B', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color: warn ? '#EF4444' : '#F8FAFC', fontSize: 13, fontWeight: 500 }}>{value}</div>
    </div>
  );
}

const defaultPositions: Position[] = [
  {
    id: 'pos_001',
    symbol: 'BTCUSDT',
    side: 'long',
    marginMode: 'isolated',
    size: '0.5',
    entryPrice: '45000.00',
    markPrice: '46500.00',
    liquidationPrice: '42000.00',
    leverage: 20,
    margin: '1125.00',
    unrealizedPnl: '750.00',
    unrealizedPnlRate: '0.6667',
    marginRatio: '0.2067',
    riskLevel: 'safe',
    positionValue: '23250.00',
    maintenanceMargin: '116.25',
    createdAt: Date.now() - 86400000,
  },
  {
    id: 'pos_002',
    symbol: 'ETHUSDT',
    side: 'short',
    marginMode: 'cross',
    size: '10.0',
    entryPrice: '3500.00',
    markPrice: '3450.00',
    liquidationPrice: '3650.00',
    leverage: 10,
    margin: '3500.00',
    unrealizedPnl: '500.00',
    unrealizedPnlRate: '0.1429',
    marginRatio: '1.1594',
    riskLevel: 'low',
    positionValue: '34500.00',
    maintenanceMargin: '1725.00',
    createdAt: Date.now() - 172800000,
  },
];
