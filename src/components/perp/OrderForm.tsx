'use client';

import { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Settings,
  AlertTriangle,
  DollarSign,
  Percent,
  Target,
  Shield,
} from 'lucide-react';

interface OrderFormProps {
  symbol?: string;
  markPrice?: string;
  lastPrice?: string;
  availableBalance?: string;
  maxLeverage?: number;
  onSubmit?: (order: any) => void;
  loading?: boolean;
}

type OrderType = 'market' | 'limit' | 'stop_market' | 'stop_limit';
type MarginMode = 'isolated' | 'cross';

export default function OrderForm({
  symbol = 'BTCUSDT',
  markPrice = '45000.00',
  lastPrice = '45000.50',
  availableBalance = '10000.00',
  maxLeverage = 125,
  onSubmit,
  loading = false,
}: OrderFormProps) {
  const [orderType, setOrderType] = useState<OrderType>('limit');
  const [side, setSide] = useState<'long' | 'short'>('long');
  const [marginMode, setMarginMode] = useState<MarginMode>('isolated');
  const [leverage, setLeverage] = useState(20);
  const [price, setPrice] = useState(markPrice);
  const [quantity, setQuantity] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [showTpSl, setShowTpSl] = useState(false);

  const notional = quantity && price ? (parseFloat(quantity) * parseFloat(price)).toFixed(2) : '0';
  const requiredMargin = parseFloat(notional) > 0 ? (parseFloat(notional) / leverage).toFixed(2) : '0';
  const liqPrice = calculateLiqPrice(side, price, leverage, markPrice);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit({
        symbol,
        side,
        type: orderType,
        quantity,
        price: orderType === 'market' ? undefined : price,
        stopPrice: orderType.startsWith('stop') ? stopPrice : undefined,
        leverage,
        marginMode,
        takeProfit: takeProfit || undefined,
        stopLoss: stopLoss || undefined,
      });
    }
  };

  const setQuantityPercent = (percent: number) => {
    const maxQty = (parseFloat(availableBalance) * leverage) / parseFloat(price);
    setQuantity((maxQty * percent).toFixed(4));
  };

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(30,41,59,0.8) 0%, rgba(15,23,42,0.9) 100%)',
        border: '1px solid rgba(71, 85, 105, 0.4)',
        borderRadius: 12,
        padding: 16,
        width: '100%',
        maxWidth: 380,
      }}
    >
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        <button
          onClick={() => setSide('long')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: side === 'long' ? 'rgba(16, 185, 129, 0.85)' : 'rgba(16, 185, 129, 0.15)',
            color: side === 'long' ? '#fff' : '#10B981',
            boxShadow: side === 'long' ? '0 4px 12px rgba(16, 185, 129, 0.3)' : 'none',
          }}
        >
          <TrendingUp size={16} />
          开多 / 买入
        </button>
        <button
          onClick={() => setSide('short')}
          style={{
            flex: 1,
            padding: '10px 16px',
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            background: side === 'short' ? 'rgba(239, 68, 68, 0.85)' : 'rgba(239, 68, 68, 0.15)',
            color: side === 'short' ? '#fff' : '#EF4444',
            boxShadow: side === 'short' ? '0 4px 12px rgba(239, 68, 68, 0.3)' : 'none',
          }}
        >
          <TrendingDown size={16} />
          开空 / 卖出
        </button>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
        {(['market', 'limit', 'stop_market', 'stop_limit'] as OrderType[]).map(type => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            style={{
              flex: 1,
              padding: '6px 4px',
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: orderType === type ? 600 : 400,
              background: orderType === type ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
              color: orderType === type ? '#3B82F6' : '#94A3B8',
            }}
          >
            {typeLabel(type)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {orderType.startsWith('stop') && (
          <FormField
            label="触发价格"
            icon={<Target size={14} />}
            suffix="USDT"
          >
            <input
              type="number"
              value={stopPrice}
              onChange={e => setStopPrice(e.target.value)}
              placeholder="输入触发价格"
              style={inputStyle}
            />
          </FormField>
        )}

        {orderType !== 'market' && (
          <FormField
            label="委托价格"
            icon={<DollarSign size={14} />}
            suffix="USDT"
            valueHint={markPrice}
            hintLabel="标记价"
            onHintClick={() => setPrice(markPrice)}
          >
            <input
              type="number"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="输入价格"
              style={inputStyle}
            />
          </FormField>
        )}

        <FormField
          label="数量"
          suffix={symbol.replace('USDT', '')}
        >
          <input
            type="number"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="输入数量"
            style={inputStyle}
          />
        </FormField>

        <div style={{ display: 'flex', gap: 4, marginBottom: 14 }}>
          {[0.25, 0.5, 0.75, 1].map(p => (
            <button
              key={p}
              type="button"
              onClick={() => setQuantityPercent(p)}
              style={{
                flex: 1,
                padding: '5px 0',
                borderRadius: 4,
                border: '1px solid rgba(71, 85, 105, 0.4)',
                background: 'rgba(15, 23, 42, 0.6)',
                color: '#94A3B8',
                fontSize: 11,
                cursor: 'pointer',
              }}
            >
              {p * 100}%
            </button>
          ))}
        </div>

        <FormField label="杠杆倍数" icon={<Percent size={14} />}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="range"
              min="1"
              max={maxLeverage}
              value={leverage}
              onChange={e => setLeverage(parseInt(e.target.value))}
              style={{ flex: 1, accentColor: side === 'long' ? '#10B981' : '#EF4444' }}
            />
            <span style={{ color: '#F8FAFC', fontWeight: 700, width: 50, textAlign: 'right', fontSize: 14 }}>
              {leverage}x
            </span>
          </div>
          <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
            {[5, 10, 25, 50, 75, 100].map(lv => (
              <button
                key={lv}
                type="button"
                onClick={() => setLeverage(lv)}
                style={{
                  flex: 1,
                  padding: '3px 0',
                  fontSize: 10,
                  borderRadius: 3,
                  border: 'none',
                  cursor: 'pointer',
                  background: leverage === lv ? 'rgba(59, 130, 246, 0.2)' : 'rgba(148, 163, 184, 0.1)',
                  color: leverage === lv ? '#3B82F6' : '#64748B',
                }}
              >
                {lv}x
              </button>
            ))}
          </div>
        </FormField>

        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button
            type="button"
            onClick={() => setMarginMode('isolated')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid rgba(71, 85, 105, 0.5)',
              background: marginMode === 'isolated' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              color: marginMode === 'isolated' ? '#3B82F6' : '#94A3B8',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            逐仓模式
          </button>
          <button
            type="button"
            onClick={() => setMarginMode('cross')}
            style={{
              flex: 1,
              padding: '6px 10px',
              borderRadius: 6,
              border: '1px solid rgba(71, 85, 105, 0.5)',
              background: marginMode === 'cross' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(15, 23, 42, 0.6)',
              color: marginMode === 'cross' ? '#3B82F6' : '#94A3B8',
              fontSize: 11,
              cursor: 'pointer',
            }}
          >
            全仓模式
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowTpSl(!showTpSl)}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 10px',
            marginBottom: 12,
            borderRadius: 6,
            border: '1px solid rgba(71, 85, 105, 0.3)',
            background: 'rgba(15, 23, 42, 0.4)',
            color: '#94A3B8',
            fontSize: 12,
            cursor: 'pointer',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Target size={14} />
            设置止盈止损
          </span>
          <span>{showTpSl ? '▲' : '▼'}</span>
        </button>

        {showTpSl && (
          <div style={{ marginBottom: 14, padding: 12, borderRadius: 8, background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(71, 85, 105, 0.3)' }}>
            <div style={{ marginBottom: 10 }}>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: 11, marginBottom: 4 }}>
                止盈价格 (TP)
              </label>
              <input
                type="number"
                value={takeProfit}
                onChange={e => setTakeProfit(e.target.value)}
                placeholder="止盈价格"
                style={{ ...inputStyle, background: 'rgba(15, 23, 42, 0.8)' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', color: '#94A3B8', fontSize: 11, marginBottom: 4 }}>
                止损价格 (SL)
              </label>
              <input
                type="number"
                value={stopLoss}
                onChange={e => setStopLoss(e.target.value)}
                placeholder="止损价格"
                style={{ ...inputStyle, background: 'rgba(15, 23, 42, 0.8)' }}
              />
            </div>
          </div>
        )}

        <div style={{
          background: 'rgba(15, 23, 42, 0.6)',
          borderRadius: 8,
          padding: 12,
          marginBottom: 14,
          border: '1px solid rgba(71, 85, 105, 0.3)',
        }}>
          <InfoRow label="可用余额" value={`${availableBalance} USDT`} />
          <InfoRow label="预估强平价" value={liqPrice} warn />
          <InfoRow label="预估开仓价值" value={`${notional} USDT`} />
          <InfoRow label="所需保证金" value={`${requiredMargin} USDT`} />
          <InfoRow label="手续费(预估)" value={`${(parseFloat(notional) * 0.0004).toFixed(2)} USDT`} />
        </div>

        <button
          type="submit"
          disabled={loading || !quantity}
          style={{
            width: '100%',
            padding: '12px 20px',
            borderRadius: 8,
            border: 'none',
            cursor: loading || !quantity ? 'not-allowed' : 'pointer',
            fontSize: 15,
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            opacity: loading || !quantity ? 0.5 : 1,
            background: side === 'long'
              ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
              : 'linear-gradient(135deg, #EF4444 0%, #DC2626 100%)',
            color: '#fff',
            boxShadow: side === 'long'
              ? '0 4px 16px rgba(16, 185, 129, 0.4)'
              : '0 4px 16px rgba(239, 68, 68, 0.4)',
          }}
        >
          {loading ? '提交中...' : `${side === 'long' ? '开多' : '开空'} ${symbol}`}
        </button>
      </form>

      <div style={{
        marginTop: 12,
        padding: '8px 12px',
        borderRadius: 6,
        background: 'rgba(245, 158, 11, 0.1)',
        border: '1px solid rgba(245, 158, 11, 0.2)',
        display: 'flex',
        gap: 8,
        alignItems: 'flex-start',
      }}>
        <AlertTriangle size={14} color="#F59E0B" style={{ marginTop: 2, flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 11, color: '#F59E0B', lineHeight: 1.5 }}>
          合约交易风险极高，请合理控制仓位。本平台不承担任何交易损失。
        </p>
      </div>
    </div>
  );
}

function FormField({
  label,
  children,
  icon,
  suffix,
  valueHint,
  hintLabel,
  onHintClick,
}: {
  label: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
  suffix?: string;
  valueHint?: string;
  hintLabel?: string;
  onHintClick?: () => void;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#94A3B8', fontSize: 12 }}>
          {icon}
          {label}
        </label>
        {valueHint && (
          <button
            type="button"
            onClick={onHintClick}
            style={{
              background: 'none',
              border: 'none',
              color: '#64748B',
              fontSize: 11,
              cursor: onHintClick ? 'pointer' : 'default',
            }}
          >
            {hintLabel}: {valueHint}
          </button>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        {children}
        {suffix && (
          <span style={{
            position: 'absolute',
            right: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#64748B',
            fontSize: 12,
          }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0' }}>
      <span style={{ color: '#94A3B8', fontSize: 12 }}>{label}</span>
      <span style={{ color: warn ? '#EF4444' : '#F8FAFC', fontSize: 12, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function typeLabel(type: OrderType): string {
  const map: Record<OrderType, string> = {
    market: '市价',
    limit: '限价',
    stop_market: '市价止损',
    stop_limit: '限价止损',
  };
  return map[type];
}

function calculateLiqPrice(side: string, entryPrice: string, leverage: number, _markPrice: string): string {
  const price = parseFloat(entryPrice);
  const mmr = 0.005;
  const imr = 1 / leverage;

  if (side === 'long') {
    const liqRatio = 1 + (mmr - imr);
    return `$${(price * liqRatio).toFixed(2)}`;
  } else {
    const liqRatio = 1 - (mmr - imr);
    return `$${(price * liqRatio).toFixed(2)}`;
  }
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 44px 10px 12px',
  borderRadius: 8,
  border: '1px solid rgba(71, 85, 105, 0.5)',
  background: 'rgba(15, 23, 42, 0.6)',
  color: '#F8FAFC',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};
