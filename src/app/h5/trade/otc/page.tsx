'use client';

/**
 * H5 OTC 大宗交易页
 */
import { useEffect, useState } from 'react';
import { Handshake, ShieldCheck, Clock, DollarSign, ChevronRight } from 'lucide-react';
import { marketApi, fmtPrice, type MarketTicker } from '@/lib/api/market';

interface OtcQuote {
  id: string;
  pair: string;
  apiSymbol: string;
  buy: string;
  sell: string;
  min: string;
  max: string;
  spread: string;
}

const INITIAL_QUOTES: OtcQuote[] = [
  { id: '1', pair: 'BTC/USDT', apiSymbol: 'BTCUSDT', buy: '--', sell: '--', min: '0.1', max: '50', spread: '--' },
  { id: '2', pair: 'ETH/USDT', apiSymbol: 'ETHUSDT', buy: '--', sell: '--', min: '1', max: '500', spread: '--' },
  { id: '3', pair: 'SOL/USDT', apiSymbol: 'SOLUSDT', buy: '--', sell: '--', min: '10', max: '5000', spread: '--' },
  { id: '4', pair: 'USDT/USD', apiSymbol: 'USDTUSD', buy: '1.000', sell: '1.002', min: '1000', max: '1M', spread: '0.20%' },
];

function quoteFromTicker(base: OtcQuote, ticker: MarketTicker | null): OtcQuote {
  if (!ticker || ticker.error) return base;
  const bid = Number(ticker.bestBid || ticker.lastPrice);
  const ask = Number(ticker.bestAsk || ticker.lastPrice);
  const mid = Number(ticker.lastPrice);
  const spread = bid > 0 && ask > 0 ? ((ask - bid) / ((ask + bid) / 2)) * 100 : 0;

  return {
    ...base,
    buy: bid > 0 ? fmtPrice(bid) : mid > 0 ? fmtPrice(mid * 0.9998) : '--',
    sell: ask > 0 ? fmtPrice(ask) : mid > 0 ? fmtPrice(mid * 1.0002) : '--',
    spread: spread > 0 ? `${spread.toFixed(2)}%` : '0.04%',
  };
}

export default function H5OTCSpotPage() {
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [quotes, setQuotes] = useState(INITIAL_QUOTES);
  const [selected, setSelected] = useState(INITIAL_QUOTES[0]);
  const [amount, setAmount] = useState('');

  useEffect(() => {
    let alive = true;

    async function loadQuotes() {
      const nextQuotes = await Promise.all(
        INITIAL_QUOTES.map(async (quote) => {
          if (quote.apiSymbol === 'USDTUSD') return quote;
          const ticker = await marketApi.getTicker(quote.apiSymbol).catch(() => null);
          return quoteFromTicker(quote, ticker);
        }),
      );

      if (!alive) return;
      setQuotes(nextQuotes);
      setSelected((current) => nextQuotes.find((quote) => quote.id === current.id) ?? nextQuotes[0]);
    }

    loadQuotes();

    return () => {
      alive = false;
    };
  }, []);

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>OTC 大宗交易</span>
        <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>
          大额交易，场外撮合，0 滑点
        </div>
      </div>

      {/* 优势卡片 */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1E40AF 0%, #1E3A8A 50%, #172554 100%)',
          borderRadius: 18, padding: 16, marginBottom: 12,
          position: 'relative', overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(34, 211, 238, 0.30) 0%, transparent 70%)',
          }}
        />
        <div style={{ position: 'relative' }}>
          <div style={{ fontSize: 13, color: '#fff', fontWeight: 700, marginBottom: 10 }}>
            OTC 核心优势
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {[
              { icon: DollarSign, label: '0 滑点', sub: '大额无冲击' },
              { icon: Clock, label: '快速撮合', sub: '5秒成交' },
              { icon: ShieldCheck, label: '资金安全', sub: '冷钱包存储' },
              { icon: Handshake, label: '专属客服', sub: '24h 服务' },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div
                  key={item.label}
                  style={{
                    padding: 10,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.10)',
                    borderRadius: 10,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                    <Icon size={14} color="#34D399" />
                    <span style={{ fontSize: 12, color: '#fff', fontWeight: 600 }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.60)' }}>{item.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 交易对选择 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 4px' }}>
        <div
          style={{
            width: 3, height: 14, borderRadius: 2,
            background: 'linear-gradient(180deg, #38BDF8 0%, #1E40AF 100%)',
            boxShadow: '0 0 6px rgba(56, 189, 248, 0.50)',
          }}
        />
        <span style={{ fontSize: 15, fontWeight: 700, color: '#F8FAFC' }}>选择交易对</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {quotes.map((q) => (
          <button
            key={q.id}
            onClick={() => setSelected(q)}
            style={{
              padding: 14, borderRadius: 14, textAlign: 'left',
              background: q.id === selected.id
                ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.10) 0%, rgba(26, 36, 86, 0.55) 100%)'
                : 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
              border: q.id === selected.id
                ? '1px solid rgba(56, 189, 248, 0.40)'
                : '1px solid rgba(148, 163, 184, 0.12)',
              cursor: 'pointer',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 14, color: '#F8FAFC', fontWeight: 700 }}>{q.pair}</span>
              <span
                style={{
                  fontSize: 10, padding: '2px 6px', borderRadius: 4,
                  background: 'rgba(56, 189, 248, 0.15)', color: '#38BDF8', fontWeight: 600,
                }}
              >
                点差 {q.spread}
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
              <div>
                <div style={{ fontSize: 10, color: '#7B89B8' }}>买价</div>
                <div style={{ fontSize: 13, color: '#34D399', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {q.buy}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#7B89B8' }}>卖价</div>
                <div style={{ fontSize: 13, color: '#F472B6', fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {q.sell}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: 10, color: '#7B89B8' }}>区间: {q.min} - {q.max}</span>
              {q.id === selected.id && <ChevronRight size={12} color="#38BDF8" />}
            </div>
          </button>
        ))}
      </div>

      {/* 交易 */}
      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16, padding: 14, marginBottom: 12,
        }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
          <button
            onClick={() => setSide('buy')}
            style={{
              padding: '10px 0', borderRadius: 10, border: 'none',
              background: side === 'buy' ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)' : 'rgba(148, 163, 184, 0.10)',
              color: side === 'buy' ? '#fff' : '#7B89B8',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            买入
          </button>
          <button
            onClick={() => setSide('sell')}
            style={{
              padding: '10px 0', borderRadius: 10, border: 'none',
              background: side === 'sell' ? 'linear-gradient(135deg, #F472B6 0%, #EF4444 100%)' : 'rgba(148, 163, 184, 0.10)',
              color: side === 'sell' ? '#fff' : '#7B89B8',
              fontSize: 14, fontWeight: 700, cursor: 'pointer',
            }}
          >
            卖出
          </button>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: '#7B89B8' }}>数量</span>
          <span style={{ fontSize: 11, color: '#7B89B8' }}>
            区间: {selected.min} - {selected.max}
          </span>
        </div>
        <input
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="请输入数量"
          style={{
            width: '100%', padding: '12px 14px',
            background: 'rgba(15, 27, 61, 0.50)',
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: 10, color: '#F8FAFC', fontSize: 16, fontWeight: 600, outline: 'none',
            boxSizing: 'border-box',
          }}
        />

        <div style={{ marginTop: 12, padding: 10, background: 'rgba(15, 27, 61, 0.40)', borderRadius: 8 }}>
          <Row label={side === 'buy' ? '买入价' : '卖出价'} value={side === 'buy' ? selected.buy : selected.sell} highlight />
          <Row label="预计成交" value={`${amount || '0'} ${selected.pair.split('/')[0]}`} />
          <Row label="手续费 (0.05%)" value="0.00 USDT" />
        </div>
      </div>

      <button
        style={{
          width: '100%', padding: '14px 0', borderRadius: 12, border: 'none',
          background: side === 'buy'
            ? 'linear-gradient(135deg, #34D399 0%, #10B981 100%)'
            : 'linear-gradient(135deg, #F472B6 0%, #EF4444 100%)',
          color: '#fff', fontSize: 16, fontWeight: 700, cursor: 'pointer',
        }}
      >
        {side === 'buy' ? '买入' : '卖出'} {selected.pair}
      </button>

      <div style={{ height: 20 }} />
    </div>
  );
}

function Row({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0' }}>
      <span style={{ fontSize: 12, color: '#7B89B8' }}>{label}</span>
      <span
        style={{
          fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
          color: highlight ? '#FCD535' : '#F8FAFC',
        }}
      >
        {value}
      </span>
    </div>
  );
}
