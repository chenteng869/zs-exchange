'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Row,
  Col,
  Card,
  Tag,
  Typography,
  Alert,
  Space,
  Button,
  App,
} from 'antd';
import {
  AuditOutlined,
  DollarOutlined,
  AlertOutlined,
  FieldTimeOutlined,
  CheckCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { adminFetch } from '@/lib/admin/admin-fetch';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

// Q04-3.12.b2.1: 状态映射 (route 返回大写 PENDING/APPROVED/REJECTED, 页面统一小写)
// h0 决策: 缩减为 3 种状态, 与 route 对齐
const STATUS_MAP: Record<string, { color: string; text: string }> = {
  pending:  { color: 'orange', text: '待审核' },
  approved: { color: 'cyan',   text: '已通过' },
  rejected: { color: 'red',    text: '已拒绝' },
};

const getStatusTag = (status: string) => {
  // route 返回大写枚举, 统一转小写
  const normalized = (status || '').toLowerCase();
  const config = STATUS_MAP[normalized] || { color: 'default', text: status || '-' };
  return <Tag color={config.color}>{config.text}</Tag>;
};

export default function WithdrawManagementPage() {
  const { message } = App.useApp();
  const [withdrawData, setWithdrawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Q04-3.12.b2.1: GET read-only realification
  // endpoint: /api/v1/admin/transactions/withdraw
  // 字段映射: destinationAddress <- route.address; status 统一小写
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminFetch<{ summary: any; rows: any[]; pagination: any }>(
        '/api/v1/admin/transactions/withdraw?take=50'
      );
      // 字段映射 + 状态归一化
      const items = (Array.isArray(res?.rows) ? res.rows : []).map((r: any) => ({
        ...r,
        // destinationAddress <- route.address
        destinationAddress: r.address ?? '-',
        // status: PENDING/APPROVED/REJECTED -> 小写
        status: (r.status || '').toLowerCase(),
      }));
      setWithdrawData(items);
      message.success('数据已刷新');
    } catch (e: any) {
      message.error(e?.message || '加载失败');
      setWithdrawData([]);
    } finally {
      setLoading(false);
    }
  }, [message]);

  useEffect(() => { load(); }, [load]);

  const columns = [
    {
      title: '提现单号',
      dataIndex: 'id',
      key: 'id',
      width: 150,
      render: (text: string) => (
        <Text copyable style={{ fontFamily: 'monospace', fontSize: 13 }}>
          {text?.slice(0, 12)}...
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
          {Number(r.amount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} {r.currency}
        </Text>
      ),
    },
    {
      title: '提现地址',
      dataIndex: 'destinationAddress',
      key: 'destinationAddress',
      width: 200,
      render: (addr: string) => (
        <Text code style={{ fontSize: 12 }}>
          {addr && addr !== '-' ? addr.slice(0, 14) + '...' : '-'}
        </Text>
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

  // Q04-3.12.b2.1: 移除 approve/reject write action
  // h0 决策: 不接 PUT/POST (b1 route 不实现), 保留 view 即可
  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: (record: any) => console.log('查看:', record.id),
    },
  ];

  // 派生统计 (基于 rows 实时计算, status 已归一化为小写)
  const pendingCount = withdrawData.filter((w) => w.status === 'pending').length;
  const todayTotal = withdrawData.reduce((sum, w) => sum + Number(w.amount ?? 0), 0);
  const largeAmountCount = withdrawData.filter((w) => Number(w.amount ?? 0) >= 100000).length;
  const approvedRate = withdrawData.length > 0
    ? ((withdrawData.filter((w) => w.status === 'approved').length / withdrawData.length) * 100).toFixed(1)
    : '0.0';

  return (
    <AdminLayout>
      <div className="p-6" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Title level={2} style={{ margin: 0, color: '#111827' }}>
              提现审核管理
            </Title>
            <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
              提现申请审核 · 风险评估 · 合规审批流程
            </Text>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={load} loading={loading}>刷新</Button>
          </Space>
        </div>

        {/* Q04-3.12.b2.1: 写操作提示 (b1 route 不实现 PUT, 审批接口待后续阶段开放) */}
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="审批接口待 b1+ 写接口阶段开放"
          description="当前页面为只读 GET 视图，审批/拒绝/确认等写操作需在后续 b1+ 阶段提供专用写接口后开放。"
        />

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
              description="效率提升（静态）"
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
