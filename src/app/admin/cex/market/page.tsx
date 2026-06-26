'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import {
  Card, Tag, Button, Space, Row, Col, Typography, Progress,
  Badge, Modal, Descriptions, List, Statistic, Divider, Alert,
} from 'antd';
import {
  LineChartOutlined,
  RiseOutlined,
  FallOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  DashboardOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  TeamOutlined,
  FundOutlined,
  WarningOutlined,
  SafetyCertificateOutlined,
  BarChartOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

interface MarketData {
  id: string;
  symbol: string;
  name: string;
  currentPrice: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  high24h: number;
  low24h: number;
  volume24h: number;
  marketCap: number;
  volatilityIndex: number;
  depthAvg: number;
  activeUsers: number;
  lastUpdate: string;
}

const mockMarkets: MarketData[] = [
  { id: 'MK-001', symbol: 'BTCUSDT', name: 'Bitcoin', currentPrice: 68420.35, priceChange24h: 1250.80, priceChangePercent24h: 1.86, high24h: 69200.00, low24h: 67150.30, volume24h: 2850000000, marketCap: 1342000000000, volatilityIndex: 42.5, depthAvg: 8500000, activeUsers: 12580, lastUpdate: '2024-06-08 14:59:58' },
  { id: 'MK-002', symbol: 'ETHUSDT', name: 'Ethereum', currentPrice: 3650.80, priceChange24h: -85.20, priceChangePercent24h: -2.28, high24h: 3768.90, low24h: 3612.40, volume24h: 1520000000, marketCap: 439000000000, volatilityIndex: 58.3, depthAvg: 3200000, activeUsers: 8920, lastUpdate: '2024-06-08 14:59:57' },
  { id: 'MK-003', symbol: 'SOLUSDT', name: 'Solana', currentPrice: 148.65, priceChange24h: 12.35, priceChangePercent24h: 9.06, high24h: 152.80, low24h: 135.60, volume24h: 680000000, marketCap: 65500000000, volatilityIndex: 78.2, depthAvg: 1800000, activeUsers: 5640, lastUpdate: '2024-06-08 14:59:56' },
  { id: 'MK-004', symbol: 'BNBUSDT', name: 'BNB', currentPrice: 585.40, priceChange24h: -8.15, priceChangePercent24h: -1.38, high24h: 598.70, low24h: 578.20, volume24h: 380000000, marketCap: 87200000000, volatilityIndex: 35.6, depthAvg: 1200000, activeUsers: 4280, lastUpdate: '2024-06-08 14:59:55' },
  { id: 'MK-005', symbol: 'XRPUSDT', name: 'Ripple', currentPrice: 0.5235, priceChange24h: 0.0180, priceChangePercent24h: 3.57, high24h: 0.5320, low24h: 0.5020, volume24h: 220000000, marketCap: 28500000000, volatilityIndex: 45.8, depthAvg: 650000, activeUsers: 3150, lastUpdate: '2024-06-08 14:59:54' },
  { id: 'MK-006', symbol: 'ADAUSDT', name: 'Cardano', currentPrice: 0.4620, priceChange24h: -0.0120, priceChangePercent24h: -2.53, high24h: 0.4780, low24h: 0.4550, volume24h: 185000000, marketCap: 16300000000, volatilityIndex: 52.1, depthAvg: 420000, activeUsers: 2780, lastUpdate: '2024-06-08 14:59:53' },
  { id: 'MK-007', symbol: 'DOGEUSDT', name: 'Dogecoin', currentPrice: 0.1658, priceChange24h: 0.0085, priceChangePercent24h: 5.41, high24h: 0.1702, low24h: 0.1560, volume24h: 310000000, marketCap: 23700000000, volatilityIndex: 68.5, depthAvg: 520000, activeUsers: 6890, lastUpdate: '2024-06-08 14:59:52' },
  { id: 'MK-008', symbol: 'AVAXUSDT', name: 'Avalanche', currentPrice: 38.52, priceChange24h: 2.35, priceChangePercent24h: 6.49, high24h: 39.80, low24h: 36.10, volume24h: 145000000, marketCap: 14500000000, volatilityIndex: 62.3, depthAvg: 380000, activeUsers: 1950, lastUpdate: '2024-06-08 14:59:51' },
  { id: 'MK-009', symbol: 'MATICUSDT', name: 'Polygon', currentPrice: 0.7230, priceChange24h: -0.0250, priceChangePercent24h: -3.34, high24h: 0.7520, low24h: 0.7100, volume24h: 98000000, marketCap: 7200000000, volatilityIndex: 48.7, depthAvg: 280000, activeUsers: 1620, lastUpdate: '2024-06-08 14:59:50' },
  { id: 'MK-010', symbol: 'DOTUSDT', name: 'Polkadot', currentPrice: 7.25, priceChange24h: 0.32, priceChangePercent24h: 4.62, high24h: 7.48, low24h: 6.92, volume24h: 112000000, marketCap: 9800000000, volatilityIndex: 55.4, depthAvg: 350000, activeUsers: 2180, lastUpdate: '2024-06-08 14:59:49' },
];

export default function MarketPage() {
  const [selectedMarket, setSelectedMarket] = useState<MarketData | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const totalPairs = mockMarkets.length;
  const totalVolume24h = mockMarkets.reduce((sum, m) => sum + m.volume24h, 0);
  const avgVolatility = (mockMarkets.reduce((sum, m) => sum + m.volatilityIndex, 0) / mockMarkets.length).toFixed(1);
  const totalActiveUsers = mockMarkets.reduce((sum, m) => sum + m.activeUsers, 0);
  const avgDepth = (mockMarkets.reduce((sum, m) => sum + m.depthAvg, 0) / mockMarkets.length / 1000000).toFixed(1);

  const handleView = (record: MarketData) => { setSelectedMarket(record); setDetailModalVisible(true); };

  const columns = [
    { title: '交易对', dataIndex: 'symbol', key: 'symbol', width: 130, render: (sym: string) => <Text code className="text-sm font-mono font-bold">{sym}</Text> },
    { title: '名称', dataIndex: 'name', key: 'name', width: 110, render: (n: string) => <span className="font-medium">{n}</span> },
    {
      title: '当前价格', key: 'price', width: 130,
      render: (_: any, r: MarketData) => (<div><span className="font-mono font-bold">${r.currentPrice.toLocaleString(undefined, { maximumFractionDigits: r.currentPrice >= 1 ? 2 : 4 })}</span><br /><span className={`text-xs ${r.priceChangePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>{r.priceChangePercent24h >= 0 ? '+' : ''}{r.priceChangePercent24h.toFixed(2)}%</span></div>),
    },
    { title: '24H涨跌额', dataIndex: 'priceChange24h', key: 'priceChange24h', width: 120, render: (v: number) => <span className={`font-mono ${v >= 0 ? 'text-green-600' : 'text-red-600'}`}>{v >= 0 ? '+' : ''}{v.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> },
    { title: '24H最高', dataIndex: 'high24h', key: 'high24h', width: 110, render: (p: number) => <span className="font-mono text-xs">{p.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> },
    { title: '24H最低', dataIndex: 'low24h', key: 'low24h', width: 110, render: (p: number) => <span className="font-mono text-xs">{p.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span> },
    { title: '24H成交量', dataIndex: 'volume24h', key: 'volume24h', width: 130, render: (v: number) => <span className="font-mono">${(v / 1000000).toFixed(1)}M</span> },
    { title: '波动率', dataIndex: 'volatilityIndex', key: 'volatilityIndex', width: 110, render: (idx: number) => (<Progress percent={Math.min(idx * 1.2, 100)} size="small" strokeColor={idx > 60 ? '#DC2626' : idx > 40 ? '#F59E0B' : '#16A34A'} format={() => idx.toFixed(1)} />) },
    { title: '活跃用户', dataIndex: 'activeUsers', key: 'activeUsers', width: 100, render: (n: number) => <Tag color="blue">{n}</Tag> },
  ];

  const actions = [{ key: 'view', label: '详情', icon: <EyeOutlined />, onClick: handleView }, { key: 'edit', label: '预警设置', icon: <EditOutlined /> }];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <div><h1 className="text-2xl font-bold flex items-center gap-2"><LineChartOutlined style={{ color: '#16A34A' }} /> 行情管理</h1><p className="text-gray-500 mt-1">市场行情监控 · 价格预警 · 波动率追踪 · 深度分析</p></div>
          <Space><Button type="primary" icon={<PlusOutlined />}>添加监控</Button><Button icon={<ReloadOutlined />}>刷新</Button><Button icon={<BarChartOutlined />}>导出行情</Button></Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}><DataCard title="交易对总数" value={totalPairs} suffix="对" icon={<DashboardOutlined />} color="#1677FF" trend="up" trendValue="+2" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="24H成交量" value={`${(totalVolume24h / 1000000000).toFixed(1)}B`} suffix=" USDT" icon={<FundOutlined />} color="#7C3AED" trend="up" trendValue="+22%" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="平均波幅" value={avgVolatility} suffix="" icon={<ThunderboltOutlined />} color="#F59E0B" trend="up" trendValue="+5.2" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="活跃用户" value={totalActiveUsers} suffix="人" icon={<TeamOutlined />} color="#16A34A" trend="up" trendValue="+156" /></Col>
          <Col xs={24} sm={12} lg={4}><DataCard title="深度均值" value={`${avgDepth}M`} suffix="" icon={<DollarOutlined />} color="#EC4899" trend="down" trendValue="-3.1" /></Col>
        </Row>

        <DataTable columns={columns} dataSource={mockMarkets} rowKey="id" title="行情监控列表" searchPlaceholder="搜索交易对或币种名称..." actions={actions} pagination={{ pageSize: 10 }} />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={<span><RiseOutlined style={{ color: '#16A34A' }} /> 涨幅TOP5</span>} className="shadow-sm">
              <List size="small" dataSource={[...mockMarkets].sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h).slice(0, 5)} renderItem={item => (
                <List.Item>
                  <div className="flex justify-between w-full"><span className="font-medium">{item.symbol}</span><span className="font-bold text-green-600">+{item.priceChangePercent24h.toFixed(2)}%</span></div>
                </List.Item>
              )} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<span><FallOutlined style={{ color: '#DC2626' }} /> 跌幅TOP5</span>} className="shadow-sm">
              <List size="small" dataSource={[...mockMarkets].sort((a, b) => a.priceChangePercent24h - b.priceChangePercent24h).slice(0, 5)} renderItem={item => (
                <List.Item>
                  <div className="flex justify-between w-full"><span className="font-medium">{item.symbol}</span><span className="font-bold text-red-600">{item.priceChangePercent24h.toFixed(2)}%</span></div>
                </List.Item>
              )} />
            </Card>
          </Col>
        </Row>

        <Modal title={`行情详情 - ${selectedMarket?.symbol}`} open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} width={650} footer={<Space><Button icon={<WarningOutlined />}>设置价格预警</Button><Button type="primary" icon={<LineChartOutlined />}>查看K线</Button></Space>}>
          {selectedMarket && (<div className="space-y-4">
            <Descriptions bordered column={2} size="middle">
              <Descriptions.Item label="交易对"><Text code className="text-lg font-bold">{selectedMarket.symbol}</Text></Descriptions.Item>
              <Descriptions.Item label="币种名称">{selectedMarket.name}</Descriptions.Item>
              <Descriptions.Item label="当前价格"><span className="font-mono font-bold text-lg">${selectedMarket.currentPrice.toLocaleString()}</span></Descriptions.Item>
              <Descriptions.Item label="24H涨跌幅"><span className={`font-bold text-lg ${selectedMarket.priceChangePercent24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>{selectedMarket.priceChangePercent24h >= 0 ? '+' : ''}{selectedMarket.priceChangePercent24h.toFixed(2)}%</span></Descriptions.Item>
              <Descriptions.Item label="24H最高价"><span className="font-mono">${selectedMarket.high24h.toLocaleString()}</span></Descriptions.Item>
              <Descriptions.Item label="24H最低价"><span className="font-mono">${selectedMarket.low24h.toLocaleString()}</span></Descriptions.Item>
              <Descriptions.Item label="24H成交量">$ {(selectedMarket.volume24h / 1000000).toFixed(1)}M</Descriptions.Item>
              <Descriptions.Item label="市值">$ {(selectedMarket.marketCap / 1000000000).toFixed(1)}B</Descriptions.Item>
              <Descriptions.Item label="波动率指数"><Progress percent={Math.min(selectedMarket.volatilityIndex * 1.2, 100)} size="small" format={() => selectedMarket.volatilityIndex.toFixed(1)} strokeColor={selectedMarket.volatilityIndex > 60 ? '#DC2626' : '#16A34A'} /></Descriptions.Item>
              <Descriptions.Item label="深度均值">$ {(selectedMarket.depthAvg / 1000000).toFixed(2)}M</Descriptions.Item>
              <Descriptions.Item label="活跃用户"><Tag color="blue">{selectedMarket.activeUsers} 人</Tag></Descriptions.Item>
              <Descriptions.Item label="最后更新" span={2}>{selectedMarket.lastUpdate}</Descriptions.Item>
            </Descriptions>
          </div>)}
        </Modal>
      </div>
    </AdminLayout>
  );
}
