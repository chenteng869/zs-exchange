'use client';

import React from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Space,
  Typography,
} from 'antd';
import {
  DollarOutlined,
  TransactionOutlined,
  CrownOutlined,
  GiftOutlined,
  EyeOutlined,
  EditOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

const mockRevenueData = [
  {
    id: 'REV-001',
    source: '现货交易手续费',
    amount: 565511.23,
    percentage: 45.0,
    trend: 'up',
    trendValue: '+18.2%',
  },
  {
    id: 'REV-002',
    source: '合约交易手续费',
    amount: 377034.15,
    percentage: 30.0,
    trend: 'up',
    trendValue: '+25.6%',
  },
  {
    id: 'REV-003',
    source: '提现手续费',
    amount: 125678.05,
    percentage: 10.0,
    trend: 'up',
    trendValue: '+12.3%',
  },
  {
    id: 'REV-004',
    source: '杠杆借贷利息',
    amount: 87724.64,
    percentage: 7.0,
    trend: 'up',
    trendValue: '+32.1%',
  },
  {
    id: 'REV-005',
    source: 'VIP订阅服务费',
    amount: 50171.22,
    percentage: 4.0,
    trend: 'up',
    trendValue: '+45.8%',
  },
  {
    id: 'REV-006',
    source: 'NFT交易佣金',
    amount: 37627.82,
    percentage: 3.0,
    trend: 'down',
    trendValue: '-5.2%',
  },
  {
    id: 'REV-007',
    source: 'DEX流动性奖励',
    amount: 12542.61,
    percentage: 1.0,
    trend: 'up',
    trendValue: '+28.9%',
  },
  {
    id: 'REV-008',
    source: 'IEO/IDO项目分成',
    amount: 6271.30,
    percentage: 0.5,
    trend: 'down',
    trendValue: '-12.4%',
  },
  {
    id: 'REV-009',
    source: 'API接口服务费',
    amount: 3762.78,
    percentage: 0.3,
    trend: 'up',
    trendValue: '+15.7%',
  },
  {
    id: 'REV-010',
    source: '市场数据订阅',
    amount: 2510.85,
    percentage: 0.2,
    trend: 'up',
    trendValue: '+22.1%',
  },
  {
    id: 'REV-011',
    source: '广告合作收入',
    amount: 1255.43,
    percentage: 0.1,
    trend: 'stable',
    trendValue: '0%',
  },
  {
    id: 'REV-012',
    source: '其他杂项收入',
    amount: 890.21,
    percentage: 0.07,
    trend: 'down',
    trendValue: '-3.8%',
  },
];

export default function RevenueManagementPage() {
  const getTrendTag = (trend: string, value: string) => {
    if (trend === 'up') return <Tag color="success" icon={<RiseOutlined />}>{value}</Tag>;
    if (trend === 'down') return <Tag color="error" icon={<FallOutlined />}>{value}</Tag>;
    return <Tag color="default">{value}</Tag>;
  };

  const columns = [
    {
      title: '收入来源',
      dataIndex: 'source',
      key: 'source',
      width: 180,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: '金额(USDT)',
      dataIndex: 'amount',
      key: 'amount',
      width: 150,
      render: (amount: number) => (
        <Text strong style={{ color: '#16A34A', fontSize: 15 }}>
          ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '占比',
      dataIndex: 'percentage',
      key: 'percentage',
      width: 100,
      render: (pct: number) => (
        <Space>
          <Text strong>{pct}%</Text>
          <div
            style={{
              width: 80,
              height: 6,
              background: '#E5E7EB',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${Math.min(pct * 2, 100)}%`,
                height: '100%',
                background: '#1677FF',
                borderRadius: 3,
              }}
            />
          </div>
        </Space>
      ),
    },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      width: 110,
      render: (_: string, record: any) => getTrendTag(record.trend, record.trendValue),
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
    {
      key: 'edit',
      label: '编辑配置',
      icon: <EditOutlined />,
      type: 'link',
      hidden: () => false,
      onClick: (record: any) => console.log('编辑:', record.id),
    },
  ];

  const totalRevenue = mockRevenueData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <AdminLayout>
      <div className="p-6" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} style={{ margin: 0, color: '#111827' }}>
            收入管理中心
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
            多元化收入结构 · 实时营收追踪 · 增长趋势分析
          </Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="本月总收入"
              value={totalRevenue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              suffix="USDT"
              icon={<DollarOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+19.8%"
              description="持续增长"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="交易手续费"
              value={942545.38}
              suffix="USDT"
              icon={<TransactionOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+20.5%"
              description="核心收入来源"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="订阅收入"
              value={50171.22}
              suffix="USDT"
              icon={<CrownOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+45.8%"
              description="增长最快"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="其他收入"
              value={63903.0}
              suffix="USDT"
              icon={<GiftOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="+12.3%"
              description="多元化布局"
            />
          </Col>
        </Row>

        {/* 收入明细表格 */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <DataTable
            columns={columns}
            dataSource={mockRevenueData}
            title="收入来源明细"
            rowKey="id"
            actions={actions}
            showAdd={false}
            searchPlaceholder="搜索收入来源..."
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 个收入项`,
            }}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
