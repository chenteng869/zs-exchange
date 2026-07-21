/**
 * /portal-preview/markets - 行情入口聚合页（P4-0031）
 * 任务：Q05-FrontPortal-P4-Core-Portal-Skeleton
 * 模板：MarketEntryTemplate
 * 约束：仅静态骨架，不接真实数据
 */

import React from 'react';
import { MarketEntryTemplate, type MarketRow } from '@/components/portal-preview/core/templates';
import { buildBreadcrumbs } from '@/components/portal-preview/core/config/p4-navigation';

export const metadata = {
  title: '行情总览 | ZSDEX',
  description: '行情入口聚合页 - 现货榜单、合约榜单、涨幅榜、新币榜、热搜榜',
};

const SAMPLE_MARKET_DATA: MarketRow[] = [
  { symbol: 'BTC', name: 'Bitcoin', price: 67892.34, change24h: 2.45, volume24h: 28_500_000_000, marketCap: 1_340_000_000_000, sparkline: [65, 67, 66, 68, 67, 69, 68] },
  { symbol: 'ETH', name: 'Ethereum', price: 3521.78, change24h: 1.82, volume24h: 15_800_000_000, marketCap: 423_000_000_000, sparkline: [34, 35, 33, 36, 35, 36, 35] },
  { symbol: 'SOL', name: 'Solana', price: 178.45, change24h: 5.32, volume24h: 3_200_000_000, marketCap: 82_000_000_000, sparkline: [165, 170, 168, 175, 172, 180, 178] },
  { symbol: 'BNB', name: 'BNB', price: 612.30, change24h: -0.85, volume24h: 1_800_000_000, marketCap: 91_000_000_000, sparkline: [620, 618, 615, 612, 610, 615, 612] },
  { symbol: 'XRP', name: 'XRP', price: 0.5234, change24h: 3.21, volume24h: 2_100_000_000, marketCap: 28_000_000_000, sparkline: [0.5, 0.51, 0.52, 0.51, 0.53, 0.52, 0.523] },
  { symbol: 'ADA', name: 'Cardano', price: 0.4521, change24h: -1.45, volume24h: 580_000_000, marketCap: 16_000_000_000, sparkline: [0.46, 0.45, 0.46, 0.45, 0.44, 0.45, 0.452] },
  { symbol: 'DOGE', name: 'Dogecoin', price: 0.1234, change24h: 7.85, volume24h: 1_500_000_000, marketCap: 18_000_000_000, sparkline: [0.11, 0.115, 0.118, 0.12, 0.122, 0.121, 0.1234] },
  { symbol: 'AVAX', name: 'Avalanche', price: 36.78, change24h: 4.12, volume24h: 620_000_000, marketCap: 14_000_000_000, sparkline: [35, 35.5, 36, 36.5, 36.2, 37, 36.78] },
  { symbol: 'MATIC', name: 'Polygon', price: 0.7234, change24h: -2.15, volume24h: 380_000_000, marketCap: 7_200_000_000, sparkline: [0.74, 0.73, 0.72, 0.71, 0.72, 0.725, 0.7234] },
  { symbol: 'LINK', name: 'Chainlink', price: 14.56, change24h: 6.78, volume24h: 480_000_000, marketCap: 8_500_000_000, sparkline: [13.5, 13.8, 14, 14.2, 14.4, 14.5, 14.56] },
];

export default function MarketsPage() {
  return (
    <MarketEntryTemplate
      title="行情总览"
      description="查看主流币种实时行情、24 小时涨跌幅与成交量（示例数据）"
      breadcrumbs={buildBreadcrumbs('/portal-preview/markets')}
      tabs={[
        { key: 'all', label: '全部', count: 10 },
        { key: 'spot', label: '现货', count: 6 },
        { key: 'futures', label: '合约', count: 4 },
        { key: 'rankings', label: '涨幅榜' },
        { key: 'new', label: '新币榜' },
        { key: 'trending', label: '热搜榜' },
      ]}
      initialTab="all"
      marketData={SAMPLE_MARKET_DATA}
      showSearch
      showSort
      complianceNote="本页面所列行情数据为示例数据，不构成任何投资建议。数字资产交易存在市场风险，请用户自行判断风险，谨慎决策。"
    />
  );
}
