'use client';

import React from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Space,
  Typography,
  Statistic,
  Divider,
} from 'antd';
import {
  RiseOutlined,
  FallOutlined,
  PercentageOutlined,
  FundOutlined,
  CalculatorOutlined,
  EyeOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

const mockRecentFlow = [
  {
    id: 'FLW-001',
    type: '收入',
    amount: 45678.5,
    currency: 'USDT',
    date: '2024-06-23 14:32',
    source: '现货交易手续费',
    status: 'confirmed',
  },
  {
    id: 'FLW-002',
    type: '支出',
    amount: -12345.0,
    currency: 'USDT',
    date: '2024-06-23 13:15',
    source: 'AWS服务器费用',
    status: 'processing',
  },
  {
    id: 'FLW-003',
    type: '收入',
    amount: 28900.25,
    currency: 'ETH',
    date: '2024-06-23 12:08',
    source: '合约交易手续费',
    status: 'confirmed',
  },
  {
    id: 'FLW-004',
    type: '收入',
    amount: 15670.8,
    currency: 'USDT',
    date: '2024-06-23 11:45',
    source: '提现手续费',
    status: 'confirmed',
  },
  {
    id: 'FLW-005',
    type: '支出',
    amount: -8923.5,
    currency: 'USDT',
    date: '2024-06-23 10:22',
    source: 'CDN流量费用',
    status: 'pending',
  },
  {
    id: 'FLW-006',
    type: '收入',
    amount: 34210.0,
    currency: 'BNB',
    date: '2024-06-23 09:56',
    source: '杠杆借贷利息',
    status: 'confirmed',
  },
  {
    id: 'FLW-007',
    type: '收入',
    amount: 9876.75,
    currency: 'USDT',
    date: '2024-06-23 08:33',
    source: 'VIP订阅费',
    status: 'confirmed',
  },
  {
    id: 'FLW-008',
    type: '支出',
    amount: -23456.0,
    currency: 'BTC',
    date: '2024-06-23 07:18',
    source: '安全审计服务',
    status: 'processing',
  },
  {
    id: 'FLW-009',
    type: '收入',
    amount: 51234.5,
    currency: 'USDT',
    date: '2024-06-22 16:42',
    source: 'NFT交易佣金',
    status: 'confirmed',
  },
  {
    id: 'FLW-010',
    type: '支出',
    amount: -6789.25,
    currency: 'USDT',
    date: '2024-06-22 15:27',
    source: '客服系统维护',
    status: 'confirmed',
  },
];

export default function FinanceOverviewDetailPage() {
  const getTrendTag = (isUp: boolean) => {
    return isUp ? (
      <Tag color="success" icon={<RiseOutlined />}>上升</Tag>
    ) : (
      <Tag color="error" icon={<FallOutlined />}>下降</Tag>
    );
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      confirmed: { color: 'green', text: '已确认' },
      processing: { color: 'blue', text: '处理中' },
      pending: { color: 'orange', text: '待处理' },
      failed: { color: 'red', text: '失败' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '流水ID',
      dataIndex: 'id',
      key: 'id',
      width: 120,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) =>
        type === '收入' ? <Tag color="success">{type}</Tag> : <Tag color="error">{type}</Tag>,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 130,
      render: (amount: number) => (
        <Text strong style={{ color: amount > 0 ? '#16A34A' : '#DC2626' }}>
          ${Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      width: 80,
    },
    {
      title: '时间',
      dataIndex: 'date',
      key: 'date',
      width: 140,
    },
    {
      title: '来源/用途',
      dataIndex: 'source',
      key: 'source',
      width: 160,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: (record: any) => console.log('查看:', record.id),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} style={{ margin: 0, color: '#111827' }}>
            财务概览分析
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
            深度财务分析 · 趋势追踪 · 盈利能力评估
          </Text>
        </div>

        {/* 核心指标卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="月度营收"
              value={1256780.5}
              suffix="USDT"
              icon={<FundOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+22.3%"
              description="创历史新高"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="环比增长"
              value={15.8}
              suffix="%"
              icon={<RiseOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+3.2%"
              description="持续增长态势"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="毛利率"
              value={68.5}
              suffix="%"
              icon={<PercentageOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+2.1%"
              description="成本优化显著"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="运营成本"
              value={396450.25}
              suffix="USDT"
              icon={<CalculatorOutlined />}
              color="#F59E0B"
              trend="down"
              trendValue="-5.8%"
              description="效率提升"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="EBITDA"
              value={860330.25}
              suffix="USDT"
              icon={<LineChartOutlined />}
              color="#06B6D4"
              trend="up"
              trendValue="+18.7%"
              description="盈利能力强健"
            />
          </Col>
        </Row>

        {/* 收支趋势分析 */}
        <Card
          bordered={false}
          className="mb-6"
          title="收支趋势描述"
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <Row gutter={[24, 24]}>
            <Col xs={24} md={12}>
              <Statistic
                title="本月总收入"
                value={1256780.5}
                prefix="$"
                suffix="USDT"
                valueStyle={{ color: '#16A34A', fontSize: 28 }}
              />
              <Space className="mt-2">
                {getTrendTag(true)}
                <Text type="secondary">较上月 +$228,340 (+22.3%)</Text>
              </Space>
              <Divider />
              <Space direction="vertical" size="small">
                <Text>· 现货交易手续费占比 45%</Text>
                <Text>· 合约交易手续费占比 30%</Text>
                <Text>· 其他收入来源占比 25%</Text>
              </Space>
            </Col>
            <Col xs={24} md={12}>
              <Statistic
                title="本月总支出"
                value={396450.25}
                prefix="$"
                suffix="USDT"
                valueStyle={{ color: '#DC2626', fontSize: 28 }}
              />
              <Space className="mt-2">
                {getTrendTag(false)}
                <Text type="secondary">较上月 -$24,420 (-5.8%)</Text>
              </Space>
              <Divider />
              <Space direction="vertical" size="small">
                <Text>· 基础设施成本占比 40%</Text>
                <Text>· 人力成本占比 35%</Text>
                <Text>· 运营及其他占比 25%</Text>
              </Space>
            </Col>
          </Row>
        </Card>

        {/* 近期流水表格 */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <DataTable
            columns={columns}
            dataSource={mockRecentFlow}
            title="近期资金流水"
            rowKey="id"
            actions={actions}
            showAdd={false}
            searchPlaceholder="搜索流水记录..."
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条记录`,
            }}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
