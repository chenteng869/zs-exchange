'use client';

import React, { useEffect, useState } from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Typography,
} from 'antd';
import {
  AuditOutlined,
  DollarOutlined,
  AlertOutlined,
  FieldTimeOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  CheckOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

export default function WithdrawManagementPage() {
  const [withdrawData, setWithdrawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch('/api/admin/withdrawals?pageSize=50', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setWithdrawData(d?.data?.items ?? []))
      .catch(() => setWithdrawData([]))
      .finally(() => setLoading(false));
  }, []);

  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待审核' },
      reviewing: { color: 'blue', text: '审核中' },
      approved: { color: 'cyan', text: '已通过' },
      confirmed: { color: 'green', text: '已完成' },
      completed: { color: 'green', text: '已完成' },
      rejected: { color: 'red', text: '已拒绝' },
      cancelled: { color: 'gray', text: '已取消' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const columns = [
    {
      title: '提现单号',
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
      width: 110,
      render: (text: string) => <Text code>{text?.slice(0, 8)}...</Text>,
    },
    {
      title: '金额',
      key: 'amount',
      width: 140,
      render: (_: any, r: any) => (
        <Text strong style={{ color: '#DC2626', fontSize: 15 }}>
          {Number(r.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} {r.currency}
        </Text>
      ),
    },
    {
      title: '提现地址',
      dataIndex: 'destinationAddress',
      key: 'destinationAddress',
      width: 140,
      render: (addr: string) => <Text code style={{ fontSize: 12 }}>{addr ? addr.slice(0, 14) + '...' : '-'}</Text>,
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
    {
      key: 'approve',
      label: '通过',
      icon: <CheckOutlined />,
      type: 'link',
      hidden: (record: any) => !['pending', 'reviewing'].includes(record.status),
      onClick: async (record: any) => {
        await fetch('/api/admin/withdrawals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: record.id, action: 'approve' }),
        });
        setWithdrawData((prev) => prev.map((w) => w.id === record.id ? { ...w, status: 'confirmed' } : w));
      },
    },
    {
      key: 'reject',
      label: '拒绝',
      icon: <CloseOutlined />,
      type: 'link',
      danger: true,
      hidden: (record: any) => !['pending', 'reviewing'].includes(record.status),
      onClick: async (record: any) => {
        await fetch('/api/admin/withdrawals', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id: record.id, action: 'reject' }),
        });
        setWithdrawData((prev) => prev.map((w) => w.id === record.id ? { ...w, status: 'rejected' } : w));
      },
    },
  ];

  const pendingCount = withdrawData.filter((w) => w.status === 'pending').length;
  const todayTotal = withdrawData.reduce((sum, w) => sum + Number(w.amount), 0);
  const largeAmountCount = withdrawData.filter((w) => Number(w.amount) >= 100000).length;
  const approvedRate = withdrawData.length > 0
    ? ((withdrawData.filter((w) => ['confirmed', 'approved', 'completed'].includes(w.status)).length / withdrawData.length) * 100).toFixed(1)
    : '0.0';

  return (
    <AdminLayout>
      <div className="p-6" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} style={{ margin: 0, color: '#111827' }}>
            提现审核管理
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
            提现申请审核 · 风险评估 · 合规审批流程
          </Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="待审核提现"
              value={pendingCount}
              suffix="笔"
              icon={<AuditOutlined />}
              color="#1677FF"
              trend="down"
              trendValue="-12%"
              description="需及时处理"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="今日提现额"
              value={todayTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              suffix="USDT"
              icon={<DollarOutlined />}
              color="#DC2626"
              trend="up"
              trendValue="+15.8%"
              description="提现活跃"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="大额提现数"
              value={largeAmountCount}
              suffix="笔"
              icon={<AlertOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="+8%"
              description={'>=100K USDT'}
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="平均处理时间"
              value={1.8}
              suffix="小时"
              icon={<FieldTimeOutlined />}
              color="#7C3AED"
              trend="down"
              trendValue="-25%"
              description="效率提升"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="通过率"
              value={approvedRate}
              suffix="%"
              icon={<CheckCircleOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+3.5%"
              description="审批合理"
            />
          </Col>
        </Row>

        {/* 提现列表表格 */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <DataTable
            columns={columns}
            dataSource={withdrawData}
            loading={loading}
            title="提现申请列表"
            rowKey="id"
            actions={actions}
            showAdd={false}
            searchPlaceholder="搜索单号或用户..."
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
