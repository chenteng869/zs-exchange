/**
 * MarketEntryTemplate - 行情入口模板
 * 用途：行情总览、榜单入口、币种列表
 * 设计系统：v6 纯黑无色相
 */

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { BRAND, STATUS } from '../../brand';

export interface MarketEntryTemplateProps {
  title: string;
  description?: string;
  breadcrumbs?: { label: string; href: string }[];
  tabs?: { key: string; label: string; count?: number }[];
  initialTab?: string;
  marketData?: MarketRow[];
  onRowClick?: (row: MarketRow) => void;
  showSearch?: boolean;
  showSort?: boolean;
  complianceNote?: string;
  children?: React.ReactNode;
}

export interface MarketRow {
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
  sparkline?: number[];
}

function useSparklineDrift(initial: number[] = []) {
  const [data, setData] = useState(initial);
  useEffect(() => {
    if (initial.length === 0) return;
    const id = setInterval(() => {
      setData((prev) => {
        const next = [...prev.slice(1), prev[prev.length - 1] + (Math.random() - 0.5) * 2];
        return next;
      });
    }, 2500);
    return () => clearInterval(id);
  }, [initial]);
  return data;
}

function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  if (data.length < 2) return <div className="w-full h-8" />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80;
  const h = 32;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * h;
    return `${x},${y}`;
  }).join(' ');
  const color = positive ? BRAND.success : BRAND.danger;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" />
    </svg>
  );
}

export function MarketEntryTemplate({
  title,
  description,
  breadcrumbs,
  tabs = [],
  initialTab,
  marketData = [],
  onRowClick,
  showSearch = true,
  showSort = true,
  complianceNote,
  children,
}: MarketEntryTemplateProps) {
  const [activeTab, setActiveTab] = useState(initialTab || tabs[0]?.key || '');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'price' | 'change24h' | 'volume24h' | 'marketCap'>('volume24h');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selectedRow, setSelectedRow] = useState<MarketRow | null>(null);

  const filtered = useMemo(() => {
    let rows = marketData;
    if (search) {
      const s = search.toLowerCase();
      rows = rows.filter((r) => r.symbol.toLowerCase().includes(s) || r.name.toLowerCase().includes(s));
    }
    rows = [...rows].sort((a, b) => {
      const av = a[sortBy];
      const bv = b[sortBy];
      return sortDir === 'asc' ? av - bv : bv - av;
    });
    return rows;
  }, [marketData, search, sortBy, sortDir]);

  const handleSort = (col: typeof sortBy) => {
    if (sortBy === col) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(col);
      setSortDir('desc');
    }
  };

  return (
    <div className="min-h-screen w-full" style={{ background: BRAND.bg, color: BRAND.text }}>
      {/* 1. 面包屑 */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="px-6 pt-6 text-sm" style={{ color: BRAND.textSub }}>
          {breadcrumbs.map((c, i) => (
            <span key={c.href}>
              {i > 0 && <span className="mx-2" style={{ color: BRAND.textMute }}>/</span>}
              <a href={c.href} className="hover:underline">{c.label}</a>
            </span>
          ))}
        </nav>
      )}

      {/* 2. 标题 + Tab 切换 */}
      <section className="px-6 md:px-12 py-8" style={{ borderBottom: `1px solid ${BRAND.border}` }}>
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-semibold mb-2" style={{ color: BRAND.text }}>
            {title}
          </h1>
          {description && <p className="text-sm mb-6" style={{ color: BRAND.textSub }}>{description}</p>}
          {tabs.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  style={{
                    background: activeTab === tab.key ? BRAND.bgCard : 'transparent',
                    color: activeTab === tab.key ? BRAND.text : BRAND.textSub,
                    border: `1px solid ${activeTab === tab.key ? BRAND.borderStrong : 'transparent'}`,
                  }}
                >
                  {tab.label}
                  {typeof tab.count === 'number' && (
                    <span className="ml-1.5 text-xs" style={{ color: BRAND.textMute }}>({tab.count})</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 3. 工具栏：搜索 + 排序 */}
      {(showSearch || showSort) && (
        <section className="px-6 md:px-12 py-4">
          <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-3">
            {showSearch && (
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <input
                  type="text"
                  placeholder="搜索币种 / 名称"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 rounded-md text-sm outline-none"
                  style={{ background: BRAND.bgCard, color: BRAND.text, border: `1px solid ${BRAND.border}` }}
                />
              </div>
            )}
            {showSort && (
              <div className="flex gap-2">
                {(['price', 'change24h', 'volume24h', 'marketCap'] as const).map((col) => (
                  <button
                    key={col}
                    onClick={() => handleSort(col)}
                    className="px-3 py-1.5 rounded-md text-xs"
                    style={{
                      background: sortBy === col ? BRAND.primaryLt : 'transparent',
                      color: sortBy === col ? BRAND.primary : BRAND.textSub,
                      border: `1px solid ${sortBy === col ? BRAND.primary : BRAND.border}`,
                    }}
                  >
                    {col === 'price' && '价格'}
                    {col === 'change24h' && '24h 涨跌'}
                    {col === 'volume24h' && '24h 成交量'}
                    {col === 'marketCap' && '市值'}
                    {sortBy === col && (sortDir === 'asc' ? ' ↑' : ' ↓')}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 4. 行情列表 */}
      <section className="px-6 md:px-12 py-6">
        <div className="max-w-7xl mx-auto">
          {filtered.length === 0 ? (
            <div
              className="rounded-lg p-12 text-center"
              style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}
            >
              <div className="text-sm" style={{ color: BRAND.textMute }}>暂无数据（示例数据）</div>
            </div>
          ) : (
            <div className="rounded-lg overflow-hidden" style={{ background: BRAND.bgCard, border: `1px solid ${BRAND.border}` }}>
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: BRAND.cardElevated }}>
                    <th className="text-left px-4 py-3 text-xs font-medium" style={{ color: BRAND.textSub }}>币种</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: BRAND.textSub }}>价格</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: BRAND.textSub }}>24h</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: BRAND.textSub }}>24h 成交量</th>
                    <th className="text-right px-4 py-3 text-xs font-medium" style={{ color: BRAND.textSub }}>市值</th>
                    <th className="text-center px-4 py-3 text-xs font-medium" style={{ color: BRAND.textSub }}>走势</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row, i) => {
                    const positive = row.change24h >= 0;
                    return (
                      <tr
                        key={row.symbol}
                        onClick={() => { setSelectedRow(row); onRowClick?.(row); }}
                        className="cursor-pointer transition-colors"
                        style={{ borderTop: i > 0 ? `1px solid ${BRAND.border}` : 'none' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = BRAND.bgCardHover)}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium" style={{ color: BRAND.text }}>{row.symbol}</div>
                          <div className="text-xs" style={{ color: BRAND.textMute }}>{row.name}</div>
                        </td>
                        <td className="text-right px-4 py-3 tabular-nums" style={{ color: BRAND.text }}>
                          {row.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
                        </td>
                        <td className="text-right px-4 py-3 tabular-nums" style={{ color: positive ? BRAND.success : BRAND.danger }}>
                          {positive ? '+' : ''}{row.change24h.toFixed(2)}%
                        </td>
                        <td className="text-right px-4 py-3 tabular-nums" style={{ color: BRAND.textSub }}>
                          {(row.volume24h / 1_000_000).toFixed(2)}M
                        </td>
                        <td className="text-right px-4 py-3 tabular-nums" style={{ color: BRAND.textSub }}>
                          {(row.marketCap / 1_000_000_000).toFixed(2)}B
                        </td>
                        <td className="text-center px-4 py-3">
                          <div className="inline-block">
                            <SparklineWithDrift data={row.sparkline || [1, 2, 1.5, 2.5, 2, 3]} positive={positive} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* 5. 自定义 children */}
      {children && (
        <section className="px-6 md:px-12 py-6">
          <div className="max-w-7xl mx-auto">{children}</div>
        </section>
      )}

      {/* 6. 合规提示 */}
      {complianceNote && (
        <section className="px-6 md:px-12 py-6" style={{ background: BRAND.bgCard, borderTop: `1px solid ${BRAND.border}` }}>
          <div className="max-w-7xl mx-auto text-xs" style={{ color: BRAND.textSub }}>
            <span className="font-medium mr-2" style={{ color: BRAND.warning }}>合规提示：</span>
            {complianceNote}
          </div>
        </section>
      )}

      {/* 7. 详情 Drawer */}
      {selectedRow && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          style={{ background: BRAND.overlay }}
          onClick={() => setSelectedRow(null)}
        >
          <div
            className="w-full max-w-md h-full p-6 overflow-y-auto"
            style={{ background: BRAND.cardElevated, color: BRAND.text, animation: 'p4DrawerIn 0.3s ease-out' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="text-2xl font-semibold" style={{ color: BRAND.text }}>{selectedRow.symbol}</div>
                <div className="text-sm" style={{ color: BRAND.textSub }}>{selectedRow.name}</div>
              </div>
              <button
                onClick={() => setSelectedRow(null)}
                className="px-3 py-1 rounded-md text-sm"
                style={{ background: BRAND.bgCard, color: BRAND.textSub }}
              >
                关闭
              </button>
            </div>
            <div className="text-3xl font-semibold mb-4 tabular-nums" style={{ color: BRAND.text }}>
              {selectedRow.price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 4 })}
            </div>
            <div className="text-sm mb-6 tabular-nums" style={{ color: selectedRow.change24h >= 0 ? BRAND.success : BRAND.danger }}>
              24h {selectedRow.change24h >= 0 ? '+' : ''}{selectedRow.change24h.toFixed(2)}%
            </div>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between" style={{ borderBottom: `1px solid ${BRAND.border}`, paddingBottom: 8 }}>
                <span style={{ color: BRAND.textSub }}>24h 成交量</span>
                <span className="tabular-nums" style={{ color: BRAND.text }}>{(selectedRow.volume24h / 1_000_000).toFixed(2)}M</span>
              </div>
              <div className="flex justify-between" style={{ borderBottom: `1px solid ${BRAND.border}`, paddingBottom: 8 }}>
                <span style={{ color: BRAND.textSub }}>市值</span>
                <span className="tabular-nums" style={{ color: BRAND.text }}>{(selectedRow.marketCap / 1_000_000_000).toFixed(2)}B</span>
              </div>
            </div>
            <div className="mt-6 text-xs" style={{ color: BRAND.textMute }}>
              行情数据为示例数据，不构成投资建议。
            </div>
          </div>
          <style jsx>{`
            @keyframes p4DrawerIn {
              from { transform: translateX(100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </div>
      )}
    </div>
  );
}

function SparklineWithDrift({ data, positive }: { data: number[]; positive: boolean }) {
  const drifted = useSparklineDrift(data);
  return <Sparkline data={drifted} positive={positive} />;
}

export default MarketEntryTemplate;
