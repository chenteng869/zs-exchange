'use client';

import { useState, useEffect, useMemo } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface OrderBookEntry {
  price: string;
  quantity: string;
  total: string;
}

interface OrderBookProps {
  bids?: OrderBookEntry[];
  asks?: OrderBookEntry[];
  lastPrice?: string;
  priceChange?: string;
  priceChangePercent?: string;
  symbol?: string;
  precision?: { price: number; amount: number };
  onPriceClick?: (price: string) => void;
  loading?: boolean;
}

const DEFAULT_BIDS: OrderBookEntry[] = Array.from({ length: 20 }, (_, i) => {
  const price = 45000 - i * 5 - Math.random() * 3;
  const qty = Math.random() * 2 + 0.1;
  let total = 0;
  for (let j = 0; j <= i; j++) {
    total += Math.random() * 2 + 0.1;
  }
  return {
    price: price.toFixed(2),
    quantity: qty.toFixed(4),
    total: total.toFixed(4),
  };
});

const DEFAULT_ASKS: OrderBookEntry[] = Array.from({ length: 20 }, (_, i) => {
  const price = 45000 + i * 5 + Math.random() * 3;
  const qty = Math.random() * 2 + 0.1;
  let total = 0;
  for (let j = 0; j <= i; j++) {
    total += Math.random() * 2 + 0.1;
  }
  return {
    price: price.toFixed(2),
    quantity: qty.toFixed(4),
    total: total.toFixed(4),
  };
});

export default function OrderBook({
  bids = DEFAULT_BIDS,
  asks = DEFAULT_ASKS,
  lastPrice = '45000.00',
  priceChange = '+1000.00',
  priceChangePercent = '+2.27',
  symbol = 'BTCUSDT',
  precision = { price: 2, amount: 4 },
  onPriceClick,
  loading = false,
}: OrderBookProps) {
  const [grouping, setGrouping] = useState(0.1);
  const [reversed, setReversed] = useState(false);
  const [hoveredPrice, setHoveredPrice] = useState<string | null>(null);

  const maxTotal = useMemo(() => {
    const maxBid = bids.length > 0 ? parseFloat(bids[bids.length - 1].total) : 0;
    const maxAsk = asks.length > 0 ? parseFloat(asks[asks.length - 1].total) : 0;
    return Math.max(maxBid, maxAsk, 1);
  }, [bids, asks]);

  const isPriceUp = parseFloat(priceChange) >= 0;

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)',
        border: '1px solid rgba(71, 85, 105, 0.4)',
        borderRadius: 12,
        padding: 12,
        width: '100%',
        maxWidth: 320,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>订单簿</span>
        <div style={{ display: 'flex', gap: 4 }}>
          {[0.01, 0.1, 1, 10].map(g => (
            <button
              key={g}
              onClick={() => setGrouping(g)}
              style={{
                padding: '2px 6px',
                fontSize: 10,
                borderRadius: 4,
                border: 'none',
                background: grouping === g ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                color: grouping === g ? '#3B82F6' : '#64748B',
                cursor: 'pointer',
              }}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(71, 85, 105, 0.3)' }}>
        <span style={{ color: '#64748B', fontSize: 11, textAlign: 'left' }}>价格(USDT)</span>
        <span style={{ color: '#64748B', fontSize: 11, textAlign: 'right' }}>数量</span>
        <span style={{ color: '#64748B', fontSize: 11, textAlign: 'right' }}>累计</span>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 20, color: '#64748B' }}>加载中...</div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column-reverse', height: 180, overflow: 'hidden' }}>
            {reversed ? bids.slice(0, 15).map((order, i) => (
              <OrderRow
                key={`ask-${i}`}
                side="sell"
                order={order}
                maxTotal={maxTotal}
                precision={precision}
                isHovered={hoveredPrice === order.price}
                onHover={setHoveredPrice}
                onClick={() => onPriceClick && onPriceClick(order.price)}
              />
            )) : asks.slice(0, 15).map((order, i) => (
              <OrderRow
                key={`ask-${i}`}
                side="sell"
                order={order}
                maxTotal={maxTotal}
                precision={precision}
                isHovered={hoveredPrice === order.price}
                onHover={setHoveredPrice}
                onClick={() => onPriceClick && onPriceClick(order.price)}
              />
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '8px 0',
              borderTop: '1px solid rgba(71, 85, 105, 0.3)',
              borderBottom: '1px solid rgba(71, 85, 105, 0.3)',
              margin: '4px 0',
              gap: 8,
            }}
          >
            <span
              style={{
                color: isPriceUp ? '#10B981' : '#EF4444',
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              {lastPrice}
            </span>
            <span
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                color: isPriceUp ? '#10B981' : '#EF4444',
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {isPriceUp ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
              {priceChangePercent}%
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', height: 180, overflow: 'hidden' }}>
            {reversed ? asks.slice(0, 15).map((order, i) => (
              <OrderRow
                key={`bid-${i}`}
                side="buy"
                order={order}
                maxTotal={maxTotal}
                precision={precision}
                isHovered={hoveredPrice === order.price}
                onHover={setHoveredPrice}
                onClick={() => onPriceClick && onPriceClick(order.price)}
              />
            )) : bids.slice(0, 15).map((order, i) => (
              <OrderRow
                key={`bid-${i}`}
                side="buy"
                order={order}
                maxTotal={maxTotal}
                precision={precision}
                isHovered={hoveredPrice === order.price}
                onHover={setHoveredPrice}
                onClick={() => onPriceClick && onPriceClick(order.price)}
              />
            ))}
          </div>
        </>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(71, 85, 105, 0.3)' }}>
        <button
          onClick={() => setReversed(!reversed)}
          style={{
            background: 'none',
            border: 'none',
            color: '#64748B',
            fontSize: 11,
            cursor: 'pointer',
            padding: '2px 6px',
          }}
        >
          {reversed ? '↑ 正常顺序' : '↓ 反向显示'}
        </button>
        <span style={{ color: '#64748B', fontSize: 11 }}>
          深度: {maxTotal.toFixed(precision.amount)}
        </span>
      </div>
    </div>
  );
}

function OrderRow({
  side,
  order,
  maxTotal,
  precision,
  isHovered,
  onHover,
  onClick,
}: {
  side: 'buy' | 'sell';
  order: OrderBookEntry;
  maxTotal: number;
  precision: { price: number; amount: number };
  isHovered: boolean;
  onHover: (price: string | null) => void;
  onClick?: () => void;
}) {
  const bgColor = side === 'buy' ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)';
  const textColor = side === 'buy' ? '#10B981' : '#EF4444';
  const widthPercent = (parseFloat(order.total) / maxTotal) * 100;

  return (
    <div
      onMouseEnter={() => onHover(order.price)}
      onMouseLeave={() => onHover(null)}
      onClick={onClick}
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: 8,
        padding: '2px 4px',
        fontSize: 12,
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        background: isHovered ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
      }}
    >
      <div
        style={{
          position: 'absolute',
          right: side === 'buy' ? 0 : 'auto',
          left: side === 'sell' ? 0 : 'auto',
          top: 0,
          bottom: 0,
          width: `${widthPercent}%`,
          background: bgColor,
          zIndex: 0,
        }}
      />
      <span style={{ color: textColor, textAlign: 'left', position: 'relative', zIndex: 1, fontWeight: 500 }}>
        {order.price}
      </span>
      <span style={{ color: '#CBD5E1', textAlign: 'right', position: 'relative', zIndex: 1 }}>
        {order.quantity}
      </span>
      <span style={{ color: '#94A3B8', textAlign: 'right', position: 'relative', zIndex: 1 }}>
        {order.total}
      </span>
    </div>
  );
}
