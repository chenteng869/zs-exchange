'use client';

import {
  Tag,
  Progress,
  Badge,
  Button,
  Space,
  Row,
  Col,
} from 'antd';
import {
  TeamOutlined,
  FundOutlined,
  LineChartOutlined,
  DollarOutlined,
  HeartOutlined,
  EyeOutlined,
  SettingOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

interface MarketMaker {
  id: string;
  name: string;
  tradingPair: string;
  spread: number;
  depth: number;
  margin: number;
  rating: string;
  volume24h: number;
  uptime: number;
}

const mockMakers: MarketMaker[] = [
  { id: 'MM-001', name: 'Galaxy Digital', tradingPair: 'BTC/USDT', spread: 0.012, depth: 28500000, margin: 5000000, rating: 'AAA', volume24h: 185000000, uptime: 99.8 },
  { id: 'MM-002', name: 'Jump Crypto', tradingPair: 'ETH/USDT', spread: 0.008, depth: 42000000, margin: 8500000, rating: 'AAA', volume24h: 245000000, uptime: 99.9 },
  { id: 'MM-003', name: 'Cumberland', tradingPair: 'BTC/USDT', spread: 0.010, depth: 58000000, margin: 12000000, rating: 'AA+', volume24h: 380000000, uptime: 99.5 },
  { id: 'MM-004', name: 'Wintermute', tradingPair: 'ETH/USDT', spread: 0.011, depth: 35000000, margin: 7200000, rating: 'AA+', volume24h: 295000000, uptime: 99.7 },
  { id: 'MM-005', name: 'GSR Markets', tradingPair: 'SOL/USDT', spread: 0.015, depth: 12500000, margin: 2800000, rating: 'AA', volume24h: 125000000, uptime: 98.5 },
  { id: 'MM-006', name: 'Flow Traders', tradingPair: 'BTC/USDT', spread: 0.010, depth: 22000000, margin: 5500000, rating: 'AA', volume24h: 198000000, uptime: 99.6 },
  { id: 'MM-007', name: 'B2C2', tradingPair: 'ETH/USDT', spread: 0.009, depth: 31000000, margin: 6500000, rating: 'AA+', volume24h: 215000000, uptime: 99.8 },
  { id: 'MM-008', name: 'Kronos Research', tradingPair: 'SOL/USDT', spread: 0.013, depth: 18500000, margin: 3800000, rating: 'A+', volume24h: 142000000, uptime: 99.3 },
  { id: 'MM-009', name: 'Amber Group', tradingPair: 'BTC/USDT', spread: 0.011, depth: 25000000, margin: 4800000, rating: 'AA', volume24h: 168000000, uptime: 99.4 },
  { id: 'MM-010', name: 'Alameda Research', tradingPair: 'ETH/BTC', spread: 0.014, depth: 9500000, margin: 2100000, rating: 'A', volume24h: 85000000, uptime: 97.8 },
];

const ratingConfig: Record<string, { color: string; label: string }> = {
  'AAA': { color: 'gold', label: 'AAA' },
  'AA+': { color: 'green', label: 'AA+' },
  'AA': { color: 'blue', label: 'AA' },
  'A+': { color: 'cyan', label: 'A+' },
  'A': { color: 'default', label: 'A' },
};

export default function MakerPage() {
  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
    },
    {
      key: 'config',
      label: '配置',
      icon: <SettingOutlined />,
    },
  ];

  const columns = [
    {
      title: '做市商名称',
      dataIndex: 'name',
      key: 'mmName',
      render: (t: string) => <span className="font-semibold text-blue-600">{t}</span>,
    },
    {
      title: '交易对',
      dataIndex: 'tradingPair',
      key: 'tradingPair',
      render: (t: string) => (
        <Tag color="processing">{t}</Tag>
      ),
    },
    {
      title: '买卖价差',
      dataIndex: 'spread',
      key: 'bidAskSpread',
      render: (v: number) => (
        <span style={{ color: v <= 0.01 ? '#16A34A' : v <= 0.012 ? '#1677FF' : '#F59E0B', fontWeight: 600 }}>
          {v.toFixed(3)}%
        </span>
      ),
    },
    {
      title: '深度(挂单量)',
      dataIndex: 'depth',
      key: 'orderDepth',
      render: (v: number) => (
        <span className="font-semibold">${(v / 1e6).toFixed(1)}M</span>
      ),
    },
    {
      title: '保证金',
      dataIndex: 'margin',
      key: 'marginDeposit',
      render: (v: number) => (
        <span>${(v / 1e6).toFixed(2)}M</span>
      ),
    },
    {
      title: '评级',
      dataIndex: 'rating',
      key: 'creditRating',
      render: (r: string) => {
        const cfg = ratingConfig[r];
        return cfg ? <Tag color={cfg.color}>{cfg.label}</Tag> : <Tag>{r}</Tag>;
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <TeamOutlined /> 做市商(MM)管理中心
            </h1>
            <p className="text-gray-500 mt-1">流动性提供 · 报价监控 · 保证金管理 · 风险对冲</p>
          </div>
          <Space>
            <Button icon={<LineChartOutlined />}>深度分析</Button>
            <Button type="primary" icon={<ApiOutlined />}>接入新做市商</Button>
          </Space>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="做市商总数"
              value={10}
              suffix="家"
              icon={<TeamOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+2 本季度"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="总深度"
              value="285.5"
              suffix="M USDT"
              icon={<FundOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+12.3%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="日均成交量"
              value="20.36"
              suffix="亿 USDT"
              icon={<LineChartOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="+8.5%"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="保证金池"
              value="58.2"
              suffix="M USDT"
              icon={<DollarOutlined />}
              color="#7C3AED"
              trend="down"
              trendValue="-$1.2M"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="健康度"
              value="96.8"
              suffix="%"
              icon={<HeartOutlined />}
              color="#DC2626"
              trend="up"
              trendValue="+0.5%"
            />
          </Col>
        </Row>

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockMakers}
          rowKey="id"
          title="做市商列表"
          searchPlaceholder="搜索做市商名称或交易对..."
          addButtonText="新增做市商"
          actions={actions}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 家做市商` }}
        />
      </div>
    </AdminLayout>
  );
}
