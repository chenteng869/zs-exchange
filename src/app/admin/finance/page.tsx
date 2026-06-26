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
} from 'antd';
import {
  DollarOutlined,
  PayCircleOutlined,
  DollarCircleOutlined,
  TransactionOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  EyeOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

const mockFinanceData = [
  {
    id: 'FIN-2024-001',
    type: '收入',
    amount: 125000.0,
    currency: 'USDT',
    date: '2024-06-23',
    category: '交易手续费',
    status: 'completed',
  },
  {
    id: 'FIN-2024-002',
    type: '支出',
    amount: -45600.5,
    currency: 'USDT',
    date: '2024-06-22',
    category: '运营成本',
    status: 'completed',
  },
  {
    id: 'FIN-2024-003',
    type: '收入',
    amount: 89200.75,
    currency: 'USDT',
    date: '2024-06-22',
    category: '提现手续费',
    status: 'completed',
  },
  {
    id: 'FIN-2024-004',
    type: '支出',
    amount: -23400.0,
    currency: 'BTC',
    date: '2024-06-21',
    category: '服务器费用',
    status: 'pending',
  },
  {
    id: 'FIN-2024-005',
    type: '收入',
    amount: 67800.25,
    currency: 'ETH',
    date: '2024-06-21',
    category: '杠杆利息',
    status: 'completed',
  },
  {
    id: 'FIN-2024-006',
    type: '支出',
    amount: -125000.0,
    currency: 'USDT',
    date: '2024-06-20',
    category: '市场推广',
    status: 'processing',
  },
  {
    id: 'FIN-2024-007',
    type: '收入',
    amount: 38900.5,
    currency: 'USDT',
    date: '2024-06-20',
    category: '订阅服务费',
    status: 'completed',
  },
  {
    id: 'FIN-2024-008',
    type: '收入',
    amount: 256000.0,
    currency: 'USDT',
    date: '2024-06-19',
    category: '交易手续费',
    status: 'completed',
  },
  {
    id: 'FIN-2024-009',
    type: '支出',
    amount: -19200.0,
    currency: 'USDT',
    date: '2024-06-19',
    category: '合规审计',
    status: 'completed',
  },
  {
    id: 'FIN-2024-010',
    type: '收入',
    amount: 76400.75,
    currency: 'BNB',
    date: '2024-06-18',
    category: 'DEX流动性奖励',
    status: 'completed',
  },
  {
    id: 'FIN-2024-011',
    type: '支出',
    amount: -52300.0,
    currency: 'USDT',
    date: '2024-06-18',
    category: '人员薪资',
    status: 'pending',
  },
  {
    id: 'FIN-2024-012',
    type: '收入',
    amount: 145000.25,
    currency: 'USDT',
    date: '2024-06-17',
    category: 'NFT交易佣金',
    status: 'completed',
  },
];

export default function FinanceOverviewPage() {
  const getTypeTag = (type: string) => {
    if (type === '收入') return <Tag color="success">{type}</Tag>;
    return <Tag color="error">{type}</Tag>;
  };

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      completed: { color: 'green', text: '已完成' },
      pending: { color: 'orange', text: '待处理' },
      processing: { color: 'blue', text: '处理中' },
      failed: { color: 'red', text: '失败' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getCurrencyTag = (currency: string) => {
    const colorMap: Record<string, string> = {
      USDT: '#1677FF',
      BTC: '#F7931A',
      ETH: '#627EEA',
      BNB: '#F3BA2F',
    };
    return (
      <Tag style={{ color: colorMap[currency] || '#9CA3AF', borderColor: colorMap[currency] || '#9CA3AF' }}>
        {currency}
      </Tag>
    );
  };

  const columns = [
    {
      title: '记录ID',
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
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => getTypeTag(type),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount: number) => (
        <Text strong style={{ color: amount > 0 ? '#16A34A' : '#DC2626' }}>
          {amount > 0 ? '+' : ''}{Math.abs(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '币种',
      dataIndex: 'currency',
      key: 'currency',
      width: 90,
      render: (currency: string) => getCurrencyTag(currency),
    },
    {
      title: '日期',
      dataIndex: 'date',
      key: 'date',
      width: 120,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
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
      label: '查看',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: (record: any) => console.log('查看:', record.id),
    },
    {
      key: 'download',
      label: '下载凭证',
      icon: <DownloadOutlined />,
      type: 'link',
      hidden: (record: any) => record.status !== 'completed',
      onClick: (record: any) => console.log('下载:', record.id),
    },
  ];

  const totalIncome = mockFinanceData
    .filter((item) => item.type === '收入')
    .reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = Math.abs(
    mockFinanceData
      .filter((item) => item.type === '支出')
      .reduce((sum, item) => sum + item.amount, 0)
  );
  const netProfit = totalIncome - totalExpense;

  return (
    <AdminLayout>
      <div className="p-6" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} style={{ margin: 0, color: '#111827' }}>
            财务运营总览
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
            多币种收支管理 · 实时资金监控 · 智能财务分析
          </Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="总收入(USDT)"
              value={totalIncome.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              icon={<DollarOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+18.5%"
              description="本月累计"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="总支出(USDT)"
              value={totalExpense.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              icon={<PayCircleOutlined />}
              color="#DC2626"
              trend="down"
              trendValue="-3.2%"
              description="成本控制良好"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="净利润(USDT)"
              value={netProfit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              icon={<DollarCircleOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+28.7%"
              description="盈利能力增强"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="手续费收入"
              value={456780.5}
              suffix="USDT"
              icon={<TransactionOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+15.3%"
              description="核心收入来源"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="待结算"
              value={89234.75}
              suffix="USDT"
              icon={<ClockCircleOutlined />}
              color="#F59E0B"
              trend="down"
              trendValue="-12%"
              description="结算效率提升"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="资金池余额"
              value={2567890.25}
              suffix="USDT"
              icon={<WalletOutlined />}
              color="#06B6D4"
              trend="up"
              trendValue="+8.9%"
              description="储备充足"
            />
          </Col>
        </Row>

        {/* 财务流水表格 */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <DataTable
            columns={columns}
            dataSource={mockFinanceData}
            title="近期财务流水"
            rowKey="id"
            actions={actions}
            showAdd={false}
            searchPlaceholder="搜索记录ID或分类..."
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
