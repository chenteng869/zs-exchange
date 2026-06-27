'use client';

/**
 * H5 合约行情页
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { TrendingUp, TrendingDown, Flame } from 'lucide-react';
import { marketApi, fmtChange, fmtPrice, fmtVolume, type MarketTicker } from '@/lib/api/market';
import { PAIR_MAP, type H5Pair } from '@/lib/h5/top20-pairs';

type SortKey = 'default' | 'gainers' | 'losers' | 'oi';

interface PerpContract {
  symbol: string;
  baseAsset?: string;
  quoteAsset?: string;
  maxLeverage?: number;
  isActive?: boolean;
}

interface FuturesRow {
  symbol: string;
  hot: boolean;
  price: string;
  change: string;
  up: boolean;
  funding: string;
  oi: string;
  oiValue: number;
  changeValue: number;
}

function h5SymbolFromApi(symbol: string, baseAsset?: string, quoteAsset = 'USDT') {
  if (baseAsset) return `${baseAsset}/${quoteAsset}`;
  if (symbol.endsWith('USDT')) return `${symbol.slice(0, -4)}/USDT`;
  return symbol;
}

function formatFunding(rate: string | number | undefined) {
  const n = Number.parseFloat(String(rate ?? '0'));
  if (!Number.isFinite(n)) return '--';
  const pct = n * 100;
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(4)}%`;
}

function rowFromTicker(contract: PerpContract, pair: H5Pair | undefined, ticker: MarketTicker): FuturesRow {
  const h5Symbol = h5SymbolFromApi(contract.symbol, contract.baseAsset, contract.quoteAsset);
  const changeSource = ticker.changePercent24h ?? ticker.change24h ?? '0';
  const changeValue = Number.parseFloat(String(changeSource));
  const changed = fmtChange(Number.isFinite(changeValue) ? changeValue : 0);
  const openInterestValue = Number.parseFloat(String((ticker as any).openInterestValue || ticker.openInterest || 0));
  const lastPrice = Number.parseFloat(String(ticker.lastPrice));

  return {
    symbol: h5Symbol,
    hot: pair?.hot ?? false,
    price: ticker.error || !Number.isFinite(lastPrice) || lastPrice <= 0 ? '--' : fmtPrice(ticker.lastPrice),
    change: ticker.error ? '--' : changed.text,
    up: changed.up,
    funding: formatFunding(ticker.fundingRate),
    oi: openInterestValue > 0 ? `$${fmtVolume(openInterestValue)}` : '--',
    oiValue: openInterestValue,
    changeValue,
  };
}

export default function H5FuturesMarketPage() {
  const [sort, setSort] = useState<SortKey>('default');
  const [rows, setRows] = useState<FuturesRow[]>([]);

  useEffect(() => {
    let alive = true;

    async function loadFuturesRows() {
      try {
        const contracts = (await marketApi.getContracts()) as PerpContract[];
        const activeContracts = contracts.filter((contract) => contract.isActive !== false);
        const nextRows = await Promise.all(
          activeContracts.map(async (contract) => {
            const h5Symbol = h5SymbolFromApi(contract.symbol, contract.baseAsset, contract.quoteAsset);
            const pair = PAIR_MAP[h5Symbol];
            const ticker = await marketApi.getTicker(contract.symbol);
            return rowFromTicker(contract, pair, ticker);
          }),
        );

        if (alive) setRows(nextRows);
      } catch {
        if (alive) setRows([]);
      }
    }

    loadFuturesRows();

    return () => {
      alive = false;
    };
  }, []);

  const list = useMemo(() => {
    let next = [...rows];
    if (sort === 'gainers') next = next.filter((p) => p.up && p.change !== '--').sort((a, b) => b.changeValue - a.changeValue);
    if (sort === 'losers') next = next.filter((p) => !p.up && p.change !== '--').sort((a, b) => a.changeValue - b.changeValue);
    if (sort === 'oi') next = next.sort((a, b) => b.oiValue - a.oiValue);
    return next;
  }, [rows, sort]);

  return (
    <div style={{ padding: '12px' }}>
      <div style={{ marginBottom: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: '#F8FAFC' }}>合约行情</span>
        <div style={{ fontSize: 11, color: '#7B89B8', marginTop: 2 }}>
          USDT 永续合约 · 多空双向 · 高达 125x 杠杆
        </div>
      </div>

      {/* 排序 */}
      <div
        style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 12,
          background: 'rgba(15, 27, 61, 0.50)', borderRadius: 10, padding: 4,
        }}
      >
        {[
          { k: 'default', l: '默认' },
          { k: 'gainers', l: '涨幅榜' },
          { k: 'losers', l: '跌幅榜' },
          { k: 'oi', l: '持仓榜' },
        ].map((s) => {
          const active = s.k === sort;
          return (
            <button
              key={s.k}
              onClick={() => setSort(s.k as SortKey)}
              style={{
                padding: '6px 0', borderRadius: 8,
                background: active ? 'rgba(167, 139, 250, 0.20)' : 'transparent',
                color: active ? '#A78BFA' : '#7B89B8',
                border: 'none', fontSize: 11, fontWeight: 600, cursor: 'pointer',
              }}
            >
              {s.l}
            </button>
          );
        })}
      </div>

      <div
        style={{
          background: 'linear-gradient(180deg, rgba(26, 36, 86, 0.55) 0%, rgba(21, 34, 74, 0.70) 100%)',
          border: '1px solid rgba(148, 163, 184, 0.12)',
          borderRadius: 16, overflow: 'hidden',
        }}
      >
        <div
          style={{
            display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px',
            padding: '10px 14px', fontSize: 10, color: '#7B89B8',
            borderBottom: '1px solid rgba(148, 163, 184, 0.10)',
          }}
        >
          <div>交易对</div>
          <div style={{ textAlign: 'right' }}>价格</div>
          <div style={{ textAlign: 'right' }}>24h</div>
          <div style={{ textAlign: 'right' }}>资金费率</div>
        </div>
        {list.map((p, i) => (
          <Link
            key={p.symbol}
            href={`/h5/trade/futures?symbol=${encodeURIComponent(p.symbol)}`}
            style={{
              display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px',
              padding: '12px 14px', fontSize: 12,
              borderBottom: i < list.length - 1 ? '1px solid rgba(148, 163, 184, 0.06)' : 'none',
              alignItems: 'center', textDecoration: 'none',
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ color: '#F8FAFC', fontWeight: 600 }}>{p.symbol}</span>
                {p.hot && <Flame size={10} color="#F472B6" fill="#F472B6" />}
              </div>
              <div style={{ fontSize: 9, color: '#7B89B8', marginTop: 2 }}>持仓 {p.oi}</div>
            </div>
            <div
              style={{
                textAlign: 'right', color: '#F8FAFC', fontWeight: 500,
                fontVariantNumeric: 'tabular-nums', fontSize: 11,
              }}
            >
              {p.price}
            </div>
            <div
              style={{
                textAlign: 'right', fontWeight: 600, fontSize: 11,
                color: p.up ? '#34D399' : '#F472B6',
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2,
              }}
            >
              {p.up ? <TrendingUp size={9} /> : <TrendingDown size={9} />}
              {p.change}
            </div>
            <div
              style={{
                textAlign: 'right', color: '#FCD535', fontWeight: 600,
                fontVariantNumeric: 'tabular-nums', fontSize: 11,
              }}
            >
              {p.funding}
            </div>
          </Link>
        ))}
      </div>

      <div style={{ height: 20 }} />
    </div>
  );
}
