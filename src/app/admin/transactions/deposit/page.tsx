'use client';

import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Space,
  Typography,
} from 'antd';
import {
  WalletOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  FieldTimeOutlined,
  EyeOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

export default function DepositManagementPage() {
  const [depositData, setDepositData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/deposits?pageSize=50', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setDepositData(d?.data?.items ?? []))
      .catch(() => setDepositData([]))
      .finally(() => setLoading(false));
  }, []);

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      success: { color: 'green', text: '成功' },
      pending: { color: 'orange', text: '待确认' },
      confirming: { color: 'blue', text: '确认中' },
      failed: { color: 'red', text: '失败' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '订单号',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (text: string) => (
        <Text copyable style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {text.slice(0, 12)}...
        </Text>
      ),
    },
    {
      title: '用户',
      dataIndex: 'userId',
      key: 'userId',
      width: 120,
      render: (text: string) => <Text code>{text?.slice(0, 8)}...</Text>,
    },
    {
      title: '金额',
      key: 'amount',
      width: 140,
      render: (_: any, r: any) => (
        <Text strong style={{ color: '#16A34A', fontSize: 15 }}>
          {Number(r.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {r.currency}
        </Text>
      ),
    },
    {
      title: '网络',
      dataIndex: 'currency',
      key: 'currency',
      width: 110,
      render: (currency: string) => <Tag>{currency}</Tag>,
    },
    {
      title: 'TX哈希',
      dataIndex: 'txHash',
      key: 'txHash',
      width: 180,
      render: (hash: string) => (
        <Space>
          <Text code style={{ fontSize: 12 }}>{hash ? hash.slice(0, 16) + '...' : '-'}</Text>
          {hash && <LinkOutlined style={{ fontSize: 12, color: '#1677FF' }} />}
        </Space>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (v: string) => v?.slice(0, 19).replace('T', ' '),
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

  const totalDeposit = depositData
    .filter((d) => d.status === 'credited' || d.status === 'success')
    .reduce((sum, d) => sum + Number(d.amount), 0);
  const pendingCount = depositData.filter((d) => d.status === 'pending' || d.status === 'confirming').length;
  const failRate = depositData.length > 0
    ? ((depositData.filter((d) => d.status === 'failed').length / depositData.length) * 100).toFixed(1)
    : '0.0';

  return (
    <AdminLayout>
      <div className="p-6" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} style={{ margin: 0, color: '#111827' }}>
            充值订单管理
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
            多链充值监控 · 实时到账追踪 · 异常预警处理
          </Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="今日充值"
              value={depositData.reduce((sum, d) => sum + Number(d.amount), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              suffix="USDT"
              icon={<WalletOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+32.5%"
              description="活跃度提升"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="待确认"
              value={pendingCount}
              suffix="笔"
              icon={<ClockCircleOutlined />}
              color="#F59E0B"
              trend="down"
              trendValue="-18%"
              description="处理效率高"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="成功金额"
              value={totalDeposit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              suffix="USDT"
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+28.9%"
              description="到账正常"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="失败率"
              value={failRate}
              suffix="%"
              icon={<WarningOutlined />}
              color="#DC2626"
              trend="down"
              trendValue="-5.2%"
              description="稳定性好"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="平均到账时间"
              value={3.5}
              suffix="分钟"
              icon={<FieldTimeOutlined />}
              color="#7C3AED"
              trend="down"
              trendValue="-22%"
              description="速度提升"
            />
          </Col>
        </Row>

        {/* 充值订单表格 */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <DataTable
            columns={columns}
            dataSource={depositData}
            loading={loading}
            title="充值订单列表"
            rowKey="id"
            actions={actions}
            showAdd={false}
            searchPlaceholder="搜索订单号或用户..."
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
