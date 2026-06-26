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
  FileSyncOutlined,
  DollarOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

const mockSettlementData = [
  {
    id: 'SET-2024-001',
    parties: '商户A → 平台',
    amount: 125000.0,
    currency: 'USDT',
    time: '2024-06-23 14:30',
    status: 'completed',
  },
  {
    id: 'SET-2024-002',
    parties: '平台 → 用户B',
    amount: 45600.5,
    currency: 'BTC',
    time: '2024-06-23 13:15',
    status: 'processing',
  },
  {
    id: 'SET-2024-003',
    parties: '商户C → 平台',
    amount: 89200.75,
    currency: 'ETH',
    time: '2024-06-23 12:08',
    status: 'pending',
  },
  {
    id: 'SET-2024-004',
    parties: '平台 → 流动性提供商D',
    amount: 234000.0,
    currency: 'USDT',
    time: '2024-06-23 11:42',
    status: 'completed',
  },
  {
    id: 'SET-2024-005',
    parties: '用户E → 平台',
    amount: 67800.25,
    currency: 'BNB',
    time: '2024-06-23 10:25',
    status: 'processing',
  },
  {
    id: 'SET-2024-006',
    parties: '平台 → 商户F',
    amount: 156700.0,
    currency: 'USDT',
    time: '2024-06-23 09:18',
    status: 'failed',
  },
  {
    id: 'SET-2024-007',
    parties: '机构G → 平台',
    amount: 389000.5,
    currency: 'USDT',
    time: '2024-06-23 08:05',
    status: 'completed',
  },
  {
    id: 'SET-2024-008',
    parties: '平台 → 做市商H',
    amount: 192300.0,
    currency: 'ETH',
    time: '2024-06-22 16:52',
    status: 'pending',
  },
  {
    id: 'SET-2024-009',
    parties: '用户I → 平台',
    amount: 76400.75,
    currency: 'USDT',
    time: '2024-06-22 15:35',
    status: 'completed',
  },
  {
    id: 'SET-2024-010',
    parties: '平台 → 合作伙伴J',
    amount: 51200.0,
    currency: 'BTC',
    time: '2024-06-22 14:20',
    status: 'processing',
  },
  {
    id: 'SET-2024-011',
    parties: '交易所K → 平台',
    amount: 278900.25,
    currency: 'USDT',
    time: '2024-06-22 13:08',
    status: 'completed',
  },
  {
    id: 'SET-2024-012',
    parties: '平台 → 用户L',
    amount: 34500.0,
    currency: 'BNB',
    time: '2024-06-22 11:45',
    status: 'pending',
  },
];

export default function SettlementManagementPage() {
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      completed: { color: 'green', text: '已完成' },
      processing: { color: 'blue', text: '处理中' },
      pending: { color: 'orange', text: '待结算' },
      failed: { color: 'red', text: '失败' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getCurrencyColor = (currency: string) => {
    const colorMap: Record<string, string> = {
      USDT: '#1677FF',
      BTC: '#F7931A',
      ETH: '#627EEA',
      BNB: '#F3BA2F',
    };
    return <Tag style={{ color: colorMap[currency] || '#9CA3AF', borderColor: colorMap[currency] || '#9CA3AF' }}>{currency}</Tag>;
  };

  const columns = [
    {
      title: '结算单号',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (text: string) => (
        <Text copyable style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {text}
        </Text>
      ),
    },
    {
      title: '参与方',
      dataIndex: 'parties',
      key: 'parties',
      width: 220,
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount: number) => (
        <Text strong style={{ color: '#1677FF', fontSize: 15 }}>
          ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      width: 90,
      render: (currency: string) => getCurrencyColor(currency),
    },
    {
      title: '发起时间',
      dataIndex: 'time',
      key: 'time',
      width: 140,
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
    {
      key: 'export',
      label: '导出凭证',
      icon: <ExportOutlined />,
      type: 'link',
      hidden: (record: any) => record.status !== 'completed',
      onClick: (record: any) => console.log('导出:', record.id),
    },
  ];

  const totalAmount = mockSettlementData.reduce((sum, item) => sum + item.amount, 0);
  const successRate = ((mockSettlementData.filter((s) => s.status === 'completed').length / mockSettlementData.length) * 100).toFixed(1);

  return (
    <AdminLayout>
      <div className="p-6" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} style={{ margin: 0, color: '#111827' }}>
            结算清算中心
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
            多币种实时结算 · 跨链清算 · 智能对账
          </Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="待结算笔数"
              value={156}
              suffix="笔"
              icon={<FileSyncOutlined />}
              color="#1677FF"
              trend="down"
              trendValue="-15%"
              description="处理效率提升"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="今日结算额"
              value={totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              suffix="USDT"
              icon={<DollarOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+22.5%"
              description="活跃度增加"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="平均时长"
              value={2.3}
              suffix="小时"
              icon={<ClockCircleOutlined />}
              color="#7C3AED"
              trend="down"
              trendValue="-18%"
              description="速度提升"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="异常笔数"
              value={3}
              suffix="笔"
              icon={<WarningOutlined />}
              color="#DC2626"
              trend="down"
              trendValue="-40%"
              description="系统稳定"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="结算成功率"
              value={successRate}
              suffix="%"
              icon={<CheckCircleOutlined />}
              color="#06B6D4"
              trend="up"
              trendValue="+1.2%"
              description="可靠性高"
            />
          </Col>
        </Row>

        {/* 结算列表表格 */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <DataTable
            columns={columns}
            dataSource={mockSettlementData}
            title="结算记录列表"
            rowKey="id"
            actions={actions}
            showAdd={false}
            searchPlaceholder="搜索结算单号或参与方..."
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
