'use client';

import React from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Progress,
  Typography,
} from 'antd';
import {
  PieChartOutlined,
  FundOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
  WarningOutlined,
  ThunderboltOutlined,
  AppstoreOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text } = Typography;

const mockHoldings = [
  { id: 'H-001', name: 'Bitcoin', type: 'crypto', quantity: 12.5, currentPrice: 67523.8, value: 844047.5, allocation: 38.5, change24h: 2.35, weight: 'core' },
  { id: 'H-002', name: 'Ethereum', type: 'crypto', quantity: 185.0, currentPrice: 3285.5, value: 607817.5, allocation: 27.7, change24h: 1.82, weight: 'core' },
  { id: 'H-003', name: 'USDT', type: 'stablecoin', quantity: 280000, currentPrice: 1.0, value: 280000, allocation: 12.8, change24h: 0.0, weight: 'stable' },
  { id: 'H-004', name: 'Solana', type: 'crypto', quantity: 420.0, currentPrice: 178.9, value: 75138, allocation: 3.4, change24h: 3.15, weight: 'satellite' },
  { id: 'H-005', name: 'Arbitrum', type: 'layer2', quantity: 15000, currentPrice: 0.95, value: 14250, allocation: 0.65, change24h: 5.22, weight: 'satellite' },
  { id: 'H-006', name: 'Chainlink', type: 'oracle', quantity: 3200, currentPrice: 14.25, value: 45600, allocation: 2.08, change24h: -1.45, weight: 'satellite' },
  { id: 'H-007', name: 'Uniswap', type: 'defi', quantity: 850, currentPrice: 8.65, value: 7352.5, allocation: 0.34, change24h: 4.18, weight: 'satellite' },
  { id: 'H-008', name: 'Aave USDC', type: 'lending', quantity: 95000, currentPrice: 1.0, value: 95000, allocation: 4.33, change24h: 0.06, weight: 'income' },
  { id: 'H-009', name: 'Lido stETH', type: 'staking', quantity: 42.0, currentPrice: 3270.0, value: 137340, allocation: 6.26, change24h: 1.55, weight: 'income' },
  { id: 'H-010', name: 'GoldX Token', type: 'token', quantity: 85000, currentPrice: 0.8523, value: 72445.5, allocation: 3.30, change24h: 12.5, weight: 'satellite' },
  { id: 'H-011', name: 'Optimism', type: 'layer2', quantity: 8000, currentPrice: 2.15, value: 17200, allocation: 0.78, change24h: -3.52, weight: 'satellite' },
  { id: 'H-012', name: 'Curve 3pool LP', type: 'lp', quantity: 1250, currentPrice: 1.02, value: 1275, allocation: 0.06, change24h: 0.03, weight: 'income' },
];

const assetDistribution = [
  { label: 'BTC', value: 38.5, color: '#F7931A' },
  { label: 'ETH', value: 27.7, color: '#627EEA' },
  { label: '稳定币', value: 12.8, color: '#16A34A' },
  { label: 'DeFi收益', value: 10.59, color: '#7C3AED' },
  { label: 'Layer2', value: 4.83, color: '#F59E0B' },
  { label: '其他', value: 6.58, color: '#06B6D4' },
];

export default function PortfolioPage() {
  const totalValue = mockHoldings.reduce((sum, h) => sum + h.value, 0);
  const todayPnl = mockHoldings.reduce((sum, h) => sum + (h.value * h.change24h / 100), 0);

  const getTypeTag = (type: string) => {
    const map: Record<string, { color: string; text: string }> = {
      crypto: { color: 'blue', text: '加密货币' },
      stablecoin: { color: 'green', text: '稳定币' },
      layer2: { color: 'purple', text: 'Layer2' },
      defi: { color: 'magenta', text: 'DeFi' },
      oracle: { color: 'orange', text: '预言机' },
      lending: { color: 'cyan', text: '借贷' },
      staking: { color: 'gold', text: '质押' },
      token: { color: 'geekblue', text: '平台代币' },
      lp: { color: 'lime', text: '流动性' },
    };
    const item = map[type];
    return item ? <Tag color={item.color}>{item.text}</Tag> : <Tag>{type}</Tag>;
  };

  const getWeightBadge = (weight: string) => {
    const map: Record<string, { color: string; text: string }> = {
      core: { color: 'red', text: '核心' },
      satellite: { color: 'blue', text: '卫星' },
      stable: { color: 'green', text: '稳健' },
      income: { color: 'gold', text: '收益' },
    };
    const item = map[weight];
    return item ? <Tag color={item.color}>{item.text}</Tag> : <Tag>{weight}</Tag>;
  };

  const columns = [
    {
      title: '资产名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '数量',
      dataIndex: 'quantity',
      key: 'quantity',
      render: (val: number) => (
        <span style={{ fontFamily: 'monospace' }}>
          {val >= 1000 ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : val.toFixed(4)}
        </span>
      ),
    },
    {
      title: '现值(USDT)',
      dataIndex: 'value',
      key: 'value',
      render: (val: number) => (
        <span className="font-medium">
          ${val >= 1000 ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : val.toFixed(2)}
        </span>
      ),
      sorter: (a: any, b: any) => a.value - b.value,
    },
    {
      title: '占比',
      dataIndex: 'allocation',
      key: 'allocation',
      width: 140,
      render: (val: number) => (
        <Progress
          percent={parseFloat(val.toFixed(1))}
          size="small"
          strokeColor={val > 20 ? '#1677FF' : val > 10 ? '#7C3AED' : '#F59E0B'}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: '24h涨跌',
      dataIndex: 'change24h',
      key: 'change24h',
      width: 100,
      render: (val: number) =>
        val > 0 ? (
          <span className="text-green-600 font-medium">
            <RiseOutlined /> +{val.toFixed(2)}%
          </span>
        ) : val < 0 ? (
          <span className="text-red-500 font-medium">
            <FallOutlined /> {val.toFixed(2)}%
          </span>
        ) : (
          <span className="text-gray-400">0.00%</span>
        ),
      sorter: (a: any, b: any) => a.change24h - b.change24h,
    },
    {
      title: '权重',
      dataIndex: 'weight',
      key: 'weight',
      width: 80,
      render: (weight: string) => getWeightBadge(weight),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 标题区 */}
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: '#0F1B3D' }}
          >
            <PieChartOutlined style={{ color: '#F0B90B' }} />
            投资组合管理中心
          </h1>
          <p className="text-gray-500 mt-2">
            多资产组合配置 · 风险归因 · 再平衡建议 · 绩效归因
          </p>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="组合总值"
              value={(totalValue / 1e6).toFixed(2)}
              prefix="$"
              suffix="M"
              icon={<FundOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+3.25%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="今日盈亏"
              value={todayPnl > 0 ? `+${todayPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : todayPnl.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              prefix="$"
              icon={todayPnl >= 0 ? <RiseOutlined /> : <FallOutlined />}
              color={todayPnl >= 0 ? '#16A34A' : '#DC2626'}
              description="实时计算中"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="年化收益率"
              value={28.6}
              suffix="%"
              icon={<LineChartOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+5.8%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="最大回撤"
              value="-12.3"
              suffix="%"
              icon={<WarningOutlined />}
              color="#F59E0B"
              trend="down"
              trendValue="-2.1%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="夏普比率"
              value={2.15}
              icon={<ThunderboltOutlined />}
              color="#16A34A"
              description="风险调整后收益"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="持仓数"
              value={mockHoldings.length}
              suffix="种"
              icon={<AppstoreOutlined />}
              color="#06B6D4"
              description="跨多类别资产"
            />
          </Col>
        </Row>

        {/* 资产分布图 + 持仓列表 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card
              title="资产分布概览"
              bordered={false}
              style={{ borderRadius: 12 }}
            >
              <div className="space-y-3">
                {assetDistribution.map((item) => (
                  <div key={item.label} className="flex items-center gap-3">
                    <Text
                      strong
                      style={{
                        width: 70,
                        fontSize: 13,
                        color: item.color,
                      }}
                    >
                      {item.label}
                    </Text>
                    <Progress
                      percent={item.value}
                      size="small"
                      strokeColor={item.color}
                      showInfo={false}
                      style={{ flex: 1 }}
                    />
                    <Text style={{ width: 40, textAlign: 'right', fontSize: 13 }}>
                      {item.value}%
                    </Text>
                  </div>
                ))}
              </div>

              {/* 圆形占比示意 */}
              <div className="mt-6 flex justify-center">
                <div
                  className="relative rounded-full"
                  style={{
                    width: 180,
                    height: 180,
                    background: `conic-gradient(
                      #F7931A 0% ${assetDistribution[0].value}%,
                      #627EEA ${assetDistribution[0].value}% ${assetDistribution[0].value + assetDistribution[1].value}%,
                      #16A34A ${assetDistribution[0].value + assetDistribution[1].value}% ${assetDistribution[0].value + assetDistribution[1].value + assetDistribution[2].value}%,
                      #7C3AED ${assetDistribution[0].value + assetDistribution[1].value + assetDistribution[2].value}% ${assetDistribution[0].value + assetDistribution[1].value + assetDistribution[2].value + assetDistribution[3].value}%,
                      #F59E0B ${assetDistribution[0].value + assetDistribution[1].value + assetDistribution[2].value + assetDistribution[3].value}% ${assetDistribution[0].value + assetDistribution[1].value + assetDistribution[2].value + assetDistribution[3].value + assetDistribution[4].value}%,
                      #06B6D4 ${assetDistribution[0].value + assetDistribution[1].value + assetDistribution[2].value + assetDistribution[3].value + assetDistribution[4].value}% 100%
                    )`,
                  }}
                >
                  <div
                    className="absolute rounded-full bg-white flex items-center justify-center"
                    style={{
                      top: 20,
                      left: 20,
                      right: 20,
                      bottom: 20,
                    }}
                  >
                    <div className="text-center">
                      <div className="text-xs text-gray-400">总资产</div>
                      <div className="text-lg font-bold" style={{ color: '#0F1B3D' }}>
                        ${(totalValue / 1e6).toFixed(2)}M
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card
              bordered={false}
              style={{ borderRadius: 12 }}
            >
              <DataTable
                columns={columns}
                dataSource={mockHoldings}
                rowKey="id"
                title="持仓明细"
                searchPlaceholder="搜索资产名称..."
                showAdd={false}
                pagination={{
                  pageSize: 8,
                  showSizeChanger: true,
                  showQuickJumper: true,
                  showTotal: (total) => `共 ${total} 种资产`,
                }}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}
