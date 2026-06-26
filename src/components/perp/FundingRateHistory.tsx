'use client';

import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Clock, DollarSign, Percent, ChevronDown, ChevronUp } from 'lucide-react';

interface FundingHistoryItem {
  id: string;
  symbol: string;
  fundingRate: string;
  positionSize: string;
  fundingAmount: string;
  positionSide: 'long' | 'short';
  settledAt: number;
  markPriceAtSettle?: string;
}

interface FundingRateHistoryProps {
  history?: FundingHistoryItem[];
  currentRate?: string;
  predictedRate?: string;
  nextFundingTime?: number;
  symbol?: string;
  loading?: boolean;
}

const DEFAULT_HISTORY: FundingHistoryItem[] = Array.from({ length: 30 }, (_, i) => {
  const isLong = Math.random() > 0.5;
  const rate = (Math.random() * 0.001 - 0.0005);
  const size = Math.random() * 10 + 1;
  const amount = size * 45000 * rate;
  return {
    id: `fund_${i}`,
    symbol: 'BTCUSDT',
    fundingRate: rate.toFixed(6),
    positionSize: size.toFixed(4),
    fundingAmount: amount.toFixed(4),
    positionSide: isLong ? 'long' : 'short',
    settledAt: Date.now() - i * 8 * 60 * 60 * 1000,
    markPriceAtSettle: (45000 + Math.random() * 2000 - 1000).toFixed(2),
  };
});

export default function FundingRateHistory({
  history = DEFAULT_HISTORY,
  currentRate = '0.000100',
  predictedRate = '0.000120',
  nextFundingTime = Date.now() + 4 * 3600000,
  symbol = 'BTCUSDT',
  loading = false,
}: FundingRateHistoryProps) {
  const [view, setView] = useState<'rate' | 'my-funding'>('rate');
  const [sortBy, setSortBy] = useState<'time' | 'rate' | 'amount'>('time');
  const [timeRange, setTimeRange] = useState('30d');

  const totalFunding = useMemo(() => {
    return history.reduce((sum, h) => sum + parseFloat(h.fundingAmount), 0).toFixed(4);
  }, [history]);

  const positiveCount = useMemo(() => {
    return history.filter(h => parseFloat(h.fundingRate) > 0).length;
  }, [history]);

  const averageRate = useMemo(() => {
    if (history.length === 0) return '0';
    const sum = history.reduce((s, h) => s + parseFloat(h.fundingRate), 0);
    return (sum / history.length).toFixed(6);
  }, [history]);

  const formatTimeLeft = () => {
    const diff = Math.max(0, nextFundingTime - Date.now());
    const hours = Math.floor(diff / 3600000);
    const mins = Math.floor((diff % 3600000) / 60000);
    const secs = Math.floor((diff % 60000) / 1000);
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const [, forceUpdate] = useState(0);
  useState(() => {
    const timer = setInterval(() => forceUpdate(n => n + 1), 1000);
    return () => clearInterval(timer);
  });

  const currentRatePositive = parseFloat(currentRate) >= 0;
  const predictedPositive = parseFloat(predictedRate) >= 0;

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)',
        border: '1px solid rgba(71, 85, 105, 0.4)',
        borderRadius: 12,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, color: '#F8FAFC', fontSize: 16, fontWeight: 600 }}>
            资金费率
          </h3>
          <div style={{ display: 'flex', gap: 4 }}>
            <TabBtn active={view === 'rate'} onClick={() => setView('rate')}>费率趋势</TabBtn>
            <TabBtn active={view === 'my-funding'} onClick={() => setView('my-funding')}>我的资金费</TabBtn>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
          <StatCard
            label="当前费率"
            value={`${(parseFloat(currentRate) * 100).toFixed(4)}%`}
            subValue={currentRate}
            positive={currentRatePositive}
            icon={<Percent size={14} />}
          />
          <StatCard
            label="预测费率"
            value={`${(parseFloat(predictedRate) * 100).toFixed(4)}%`}
            subValue={predictedRate}
            positive={predictedPositive}
            icon={<TrendingUp size={14} />}
          />
          <StatCard
            label="下次结算"
            value={formatTimeLeft()}
            subValue={new Date(nextFundingTime).toLocaleTimeString()}
            icon={<Clock size={14} />}
          />
        </div>

        {view === 'my-funding' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 16 }}>
            <MiniStat label="累计资金费" value={`$${totalFunding}`} positive={parseFloat(totalFunding) >= 0} />
            <MiniStat label="收取次数" value={`${positiveCount} / ${history.length}`} />
            <MiniStat label="平均费率" value={`${(parseFloat(averageRate) * 100).toFixed(4)}%`} />
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'center' }}>
          <select value={timeRange} onChange={e => setTimeRange(e.target.value)} style={selectStyle}>
            <option value="7d">近7天</option>
            <option value="30d">近30天</option>
            <option value="90d">近90天</option>
            <option value="all">全部</option>
          </select>
          {view === 'my-funding' && (
            <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={selectStyle}>
              <option value="time">按时间排序</option>
              <option value="rate">按费率排序</option>
              <option value="amount">按金额排序</option>
            </select>
          )}
        </div>
      </div>

      <div style={{ maxHeight: 300, overflowY: 'auto' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: view === 'my-funding' ? '1.5fr 1fr 1fr 1fr' : '1.5fr 1fr 1fr',
          gap: 8,
          padding: '8px 16px',
          borderTop: '1px solid rgba(71, 85, 105, 0.3)',
          borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
          background: 'rgba(15, 23, 42, 0.6)',
        }}>
          <span style={{ color: '#64748B', fontSize: 11 }}>时间</span>
          <span style={{ color: '#64748B', fontSize: 11, textAlign: 'right' }}>费率</span>
          {view === 'my-funding' && (
            <span style={{ color: '#64748B', fontSize: 11, textAlign: 'right' }}>仓位</span>
          )}
          <span style={{ color: '#64748B', fontSize: 11, textAlign: 'right' }}>
            {view === 'my-funding' ? '金额' : '标记价格'}
          </span>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#64748B' }}>加载中...</div>
        ) : history.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 30, color: '#64748B' }}>
            <DollarSign size={32} style={{ opacity: 0.3, marginBottom: 8 }} />
            <p style={{ margin: 0, fontSize: 12 }}>暂无资金费记录</p>
          </div>
        ) : (
          history.slice(0, 20).map(item => (
            <FundingRow key={item.id} item={item} showPosition={view === 'my-funding'} />
          ))
        )}
      </div>
    </div>
  );
}

function FundingRow({ item, showPosition }: { item: FundingHistoryItem; showPosition: boolean }) {
  const ratePositive = parseFloat(item.fundingRate) > 0;
  const amountPositive = parseFloat(item.fundingAmount) > 0;

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: showPosition ? '1.5fr 1fr 1fr 1fr' : '1.5fr 1fr 1fr',
        gap: 8,
        padding: '10px 16px',
        borderBottom: '1px solid rgba(71, 85, 105, 0.15)',
        fontSize: 12,
        alignItems: 'center',
      }}
    >
      <div>
        <div style={{ color: '#F8FAFC', fontSize: 12 }}>
          {new Date(item.settledAt).toLocaleDateString()}
        </div>
        <div style={{ color: '#64748B', fontSize: 10 }}>
          {new Date(item.settledAt).toLocaleTimeString()}
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <span style={{ color: ratePositive ? '#10B981' : '#EF4444', fontWeight: 500 }}>
          {ratePositive ? '+' : ''}{(parseFloat(item.fundingRate) * 100).toFixed(4)}%
        </span>
      </div>

      {showPosition && (
        <div style={{ textAlign: 'right' }}>
          <div style={{ color: '#F8FAFC' }}>{item.positionSize}</div>
          <div style={{ color: item.positionSide === 'long' ? '#10B981' : '#EF4444', fontSize: 10 }}>
            {item.positionSide === 'long' ? '多' : '空'}
          </div>
        </div>
      )}

      <div style={{ textAlign: 'right' }}>
        {showPosition ? (
          <span style={{ color: amountPositive ? '#10B981' : '#EF4444', fontWeight: 500 }}>
            {amountPositive ? '+' : ''}${item.fundingAmount}
          </span>
        ) : (
          <span style={{ color: '#F8FAFC' }}>
            ${item.markPriceAtSettle || '-'}
          </span>
        )}
      </div>
    </div>
  );
}

function TabBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px',
        fontSize: 12,
        borderRadius: 6,
        border: 'none',
        cursor: 'pointer',
        background: active ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.1)',
        color: active ? '#3B82F6' : '#94A3B8',
        fontWeight: active ? 500 : 400,
      }}
    >
      {children}
    </button>
  );
}

function StatCard({ label, value, subValue, positive, icon }: {
  label: string;
  value: string;
  subValue?: string;
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
        <span style={{ color: '#94A3B8', fontSize: 11 }}>{label}</span>
      </div>
      <div style={{ color: positive !== undefined ? (positive ? '#10B981' : '#EF4444') : '#F8FAFC', fontSize: 15, fontWeight: 700 }}>
        {value}
      </div>
      {subValue && (
        <div style={{ color: '#64748B', fontSize: 10, marginTop: 2 }}>{subValue}</div>
      )}
    </div>
  );
}

function MiniStat({ label, value, positive }: { label: string; value: string; positive?: boolean }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ color: '#64748B', fontSize: 11, marginBottom: 4 }}>{label}</div>
      <div style={{ color: positive !== undefined ? (positive ? '#10B981' : '#EF4444') : '#F8FAFC', fontSize: 13, fontWeight: 600 }}>
        {value}
      </div>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '4px 10px',
  borderRadius: 6,
  border: '1px solid rgba(71, 85, 105, 0.5)',
  background: 'rgba(15, 23, 42, 0.8)',
  color: '#F8FAFC',
  fontSize: 11,
  cursor: 'pointer',
};
