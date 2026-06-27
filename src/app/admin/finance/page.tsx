'use client';

import React, { useEffect, useState } from 'react';
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

export default function FinanceOverviewPage() {
  const [financeData, setFinanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/finance/fees?pageSize=100', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setFinanceData(d?.data?.items ?? []))
      .catch(() => setFinanceData([]))
      .finally(() => setLoading(false));
  }, []);


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

  const totalIncome = financeData
    .filter((item) => item.type === '收入')
    .reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = Math.abs(
    financeData
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
            dataSource={financeData}
            loading={loading}
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
