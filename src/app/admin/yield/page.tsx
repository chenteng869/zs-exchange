'use client';

import React from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Typography,
  Button,
  Space,
  Statistic,
  Progress,
  Select,
  Input,
  message,
  Descriptions,
  Divider,
} from 'antd';
import {
  FundOutlined,
  DollarOutlined,
  RiseOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  FireOutlined,
  SafetyCertificateOutlined,
  StarFilled,
  ArrowRightOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Title } = Typography;

const mockProducts = [
  { id: 'YP-001', name: 'USDT活期宝', type: 'current', apy: 5.8, minAmount: 100, period: '随时', riskLevel: 'low', status: 'active', totalAUM: 12500000 },
  { id: 'YP-002', name: 'BTC定期增值计划(30天)', type: 'fixed', apy: 12.5, minAmount: 0.1, period: '30天', riskLevel: 'medium', status: 'active', totalAUM: 8500000 },
  { id: 'YP-003', name: 'ETH结构化收益产品', type: 'structured', apy: 18.2, minAmount: 1.0, period: '90天', riskLevel: 'high', status: 'active', totalAUM: 3200000 },
  { id: 'YP-004', name: '稳定币活期池', type: 'current', apy: 6.5, minAmount: 500, period: '随时', riskLevel: 'low', status: 'active', totalAUM: 9800000 },
  { id: 'YP-005', name: 'DeFi聚合收益宝(7天)', type: 'fixed', apy: 15.8, minAmount: 200, period: '7天', riskLevel: 'medium', status: 'active', totalAUM: 4500000 },
  { id: 'YP-006', name: 'SOL质押双币理财', type: 'structured', apy: 22.5, minAmount: 50, period: '60天', riskLevel: 'high', status: 'active', totalAUM: 2100000 },
  { id: 'YP-007', name: 'USDC灵活存取', type: 'current', apy: 5.2, minAmount: 100, period: '随时', riskLevel: 'low', status: 'active', totalAUM: 7200000 },
  { id: 'YP-008', name: 'BTC定投计划(90天)', type: 'fixed', apy: 14.2, minAmount: 0.05, period: '90天', riskLevel: 'medium', status: 'active', totalAUM: 5800000 },
  { id: 'YP-009', name: '链上期权结构化产品', type: 'structured', apy: 28.6, minAmount: 5000, period: '180天', riskLevel: 'high', status: 'pending', totalAUM: 1500000 },
  { id: 'YP-010', name: '多币种活期组合', type: 'current', apy: 7.2, minAmount: 1000, period: '随时', riskLevel: 'low', status: 'active', totalAUM: 6500000 },
  { id: 'YP-011', name: 'Layer2生态增益计划', type: 'fixed', apy: 16.8, minAmount: 300, period: '30天', riskLevel: 'medium', status: 'active', totalAUM: 3800000 },
  { id: 'YP-012', name: 'AI量化增强理财', type: 'structured', apy: 35.0, minAmount: 10000, period: '365天', riskLevel: 'high', status: 'upcoming', totalAUM: 800000 },
];

const hotProducts = [
  {
    id: 'HP-001',
    name: 'SOL质押双币理财',
    type: 'structured',
    apy: 22.5,
    period: '60天',
    riskLevel: 'high',
    minAmount: 50,
    description: 'SOL质押 + DeFi双收益，自动复投优化',
    investors: 2850,
    totalRaised: 2100000,
  },
  {
    id: 'HP-002',
    name: 'ETH结构化收益产品',
    type: 'structured',
    apy: 18.2,
    period: '90天',
    riskLevel: 'high',
    minAmount: 1.0,
    description: 'ETH + 期权策略，下行保护+上行参与',
    investors: 1920,
    totalRaised: 3200000,
  },
  {
    id: 'HP-003',
    name: 'DeFi聚合收益宝',
    type: 'fixed',
    apy: 15.8,
    period: '7天',
    riskLevel: 'medium',
    minAmount: 200,
    description: '跨协议自动调配，Aave/Compound/Curve最优选',
    investors: 5620,
    totalRaised: 4500000,
  },
];

function getTypeTag(type: string) {
  const map: Record<string, { color: string; text: string }> = {
    current: { color: 'green', text: '活期' },
    fixed: { color: 'blue', text: '定期' },
    structured: { color: 'purple', text: '结构化' },
  };
  const item = map[type];
  return item ? <Tag color={item.color}>{item.text}</Tag> : <Tag>{type}</Tag>;
}

function getRiskTag(risk: string) {
  const map: Record<string, { color: string; text: string }> = {
    low: { color: 'success', text: 'R1 低风险' },
    medium: { color: 'warning', text: 'R2 中风险' },
    high: { color: 'error', text: 'R3 高风险' },
  };
  const item = map[risk];
  return item ? <Tag color={item.color}>{item.text}</Tag> : <Tag>{risk}</Tag>;
}

function getStatusTag(status: string) {
  const map: Record<string, { color: string; text: string }> = {
    active: { color: 'success', text: '在售' },
    pending: { color: 'processing', text: '即将上线' },
    upcoming: { color: 'default', text: '预热中' },
    ended: { color: 'default', text: '已结束' },
  };
  const item = map[status];
  return item ? <Tag color={item.color}>{item.text}</Tag> : <Tag>{status}</Tag>;
}

export default function YieldPage() {
  const totalAUM = mockProducts.reduce((sum, p) => sum + p.totalAUM, 0);
  const avgApy = mockProducts.filter(p => p.status === 'active').reduce((sum, p) => sum + p.apy, 0) / mockProducts.filter(p => p.status === 'active').length;

  const columns = [
    {
      title: '产品名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 85,
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '年化收益率',
      dataIndex: 'apy',
      key: 'apy',
      width: 120,
      render: (val: number) => (
        <Text strong style={{ color: '#16A34A', fontSize: 15 }}>
          {val}%
        </Text>
      ),
      sorter: (a: any, b: any) => a.apy - b.apy,
    },
    {
      title: '最低金额',
      dataIndex: 'minAmount',
      key: 'minAmount',
      width: 100,
      render: (val: number) => (
        <span style={{ fontFamily: 'monospace' }}>${val >= 1 ? val.toLocaleString() : val}</span>
      ),
    },
    {
      title: '期限',
      dataIndex: 'period',
      key: 'period',
      width: 90,
    },
    {
      title: '风险等级',
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 100,
      render: (risk: string) => getRiskTag(risk),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 85,
      render: (status: string) => getStatusTag(status),
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
            <FundOutlined style={{ color: '#F0B90B' }} />
            理财产品管理中心
          </h1>
          <p className="text-gray-500 mt-2">
            活期/定期/结构化产品 · 收益优化 · 风险评级 · 自动复投
          </p>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="产品总数"
              value={mockProducts.length}
              suffix="款"
              icon={<FundOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+3款"
              description="含预热产品"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="总AUM"
              value={(totalAUM / 1e6).toFixed(1)}
              prefix="$"
              suffix="M"
              icon={<DollarOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+$2.3M"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="平均年化"
              value={avgApy.toFixed(1)}
              suffix="%"
              icon={<RiseOutlined />}
              color="#F59E0B"
              description="活跃产品均值"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="今日新增投资"
              value={385.6}
              prefix="$"
              suffix="K"
              icon={<ThunderboltOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+28%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="到期提醒"
              value={5}
              suffix="款"
              icon={<ClockCircleOutlined />}
              color="#DC2626"
              description="7日内到期"
            />
          </Col>
        </Row>

        {/* 热门产品展示 */}
        <Row gutter={[16, 16]}>
          {hotProducts.map((product) => (
            <Col xs={24} md={8} key={product.id}>
              <Card
                hoverable
                style={{
                  borderRadius: 12,
                  borderLeft: `4px solid ${product.riskLevel === 'high' ? '#DC2626' : product.riskLevel === 'medium' ? '#F59E0B' : '#16A34A'}`,
                }}
                className="h-full"
              >
                {/* 产品头部 */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <FireOutlined style={{ color: '#F59E0B' }} />
                      <Title level={5} className="m-0" style={{ fontSize: 15 }}>{product.name}</Title>
                    </div>
                    <Space size={4}>
                      {getTypeTag(product.type)}
                      {getRiskTag(product.riskLevel)}
                    </Space>
                  </div>
                  <StarFilled style={{ color: '#F0B90B', fontSize: 18 }} />
                </div>

                {/* 收益率大字号 */}
                <div className="text-center my-4 py-3" style={{ background: 'linear-gradient(135deg, #FFF7E6 0%, #FFFBE6 100%)', borderRadius: 8 }}>
                  <Text type="secondary" style={{ fontSize: 13 }}>预期年化收益率</Text>
                  <div>
                    <Text strong style={{ color: '#16A34A', fontSize: 36, lineHeight: 1.2 }}>
                      {product.apy}%
                    </Text>
                  </div>
                </div>

                {/* 产品信息 */}
                <div className="space-y-2">
                  <Row justify="space-between">
                    <Text type="secondary" style={{ fontSize: 13 }}>投资期限</Text>
                    <Text strong style={{ fontSize: 13 }}>{product.period}</Text>
                  </Row>
                  <Row justify="space-between">
                    <Text type="secondary" style={{ fontSize: 13 }}>起投金额</Text>
                    <Text strong style={{ fontSize: 13 }}>${product.minAmount >= 1 ? product.minAmount.toLocaleString() : product.minAmount}</Text>
                  </Row>
                  <Row justify="space-between">
                    <Text type="secondary" style={{ fontSize: 13 }}>参与人数</Text>
                    <Text strong style={{ fontSize: 13 }}>{product.investors.toLocaleString()}人</Text>
                  </Row>
                  <Row justify="space-between">
                    <Text type="secondary" style={{ fontSize: 13 }}>已募集</Text>
                    <Text strong style={{ fontSize: 13 }}>${(product.totalRaised / 1e6).toFixed(2)}M</Text>
                  </Row>
                </div>

                {/* 描述 */}
                <div className="mt-3 pt-3" style={{ borderTop: '1px solid #f0f0f0' }}>
                  <Text type="secondary" style={{ fontSize: 12 }}>{product.description}</Text>
                </div>

                {/* 操作按钮 */}
                <Button
                  type="primary"
                  block
                  className="mt-4"
                  icon={<ArrowRightOutlined />}
                  style={{ borderRadius: 8 }}
                >
                  立即投资
                </Button>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 全部产品列表 */}
        <Card bordered={false} style={{ borderRadius: 12 }}>
          <DataTable
            columns={columns}
            dataSource={mockProducts}
            rowKey="id"
            title="全部理财产品"
            searchPlaceholder="搜索产品名称..."
            showAdd={false}
            showFilter
            filterOptions={[
              { label: '全部类型', value: '' },
              { label: '活期', value: 'current' },
              { label: '定期', value: 'fixed' },
              { label: '结构化', value: 'structured' },
            ]}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 款产品`,
            }}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
