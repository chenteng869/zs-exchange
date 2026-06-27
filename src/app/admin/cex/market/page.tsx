'use client';

import { useEffect, useState } from 'react';
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

export default function MarketPage() {
  const [selectedMarket, setSelectedMarket] = useState<MarketData | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [markets, setMarkets] = useState<MarketData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/cex/pairs', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const items: MarketData[] = (d?.data ?? []).map((p: any) => ({
          id: p.id,
          symbol: p.symbol,
          name: p.base,
          currentPrice: 0,
          priceChange24h: 0,
          priceChangePercent24h: 0,
          high24h: 0,
          low24h: 0,
          volume24h: 0,
          marketCap: 0,
          volatilityIndex: 0,
          depthAvg: 0,
          activeUsers: 0,
          lastUpdate: '-',
        }));
        setMarkets(items);
      })
      .catch(() => setMarkets([]))
      .finally(() => setLoading(false));
  }, []);

  const totalPairs = markets.length;
  const totalVolume24h = markets.reduce((sum, m) => sum + m.volume24h, 0);
  const avgVolatility = markets.length > 0 ? (markets.reduce((sum, m) => sum + m.volatilityIndex, 0) / markets.length).toFixed(1) : '0';
  const totalActiveUsers = markets.reduce((sum, m) => sum + m.activeUsers, 0);
  const avgDepth = markets.length > 0 ? (markets.reduce((sum, m) => sum + m.depthAvg, 0) / markets.length / 1000000).toFixed(1) : '0';

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

        <DataTable columns={columns} dataSource={markets}
            loading={loading} rowKey="id" title="行情监控列表" searchPlaceholder="搜索交易对或币种名称..." actions={actions} pagination={{ pageSize: 10 }} />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title={<span><RiseOutlined style={{ color: '#16A34A' }} /> 涨幅TOP5</span>} className="shadow-sm">
              <List size="small" dataSource={[...markets].sort((a, b) => b.priceChangePercent24h - a.priceChangePercent24h).slice(0, 5)} renderItem={item => (
                <List.Item>
                  <div className="flex justify-between w-full"><span className="font-medium">{item.symbol}</span><span className="font-bold text-green-600">+{item.priceChangePercent24h.toFixed(2)}%</span></div>
                </List.Item>
              )} />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<span><FallOutlined style={{ color: '#DC2626' }} /> 跌幅TOP5</span>} className="shadow-sm">
              <List size="small" dataSource={[...markets].sort((a, b) => a.priceChangePercent24h - b.priceChangePercent24h).slice(0, 5)} renderItem={item => (
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
