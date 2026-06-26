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

const mockWithdrawData = [
  {
    id: 'WTH-2024-001',
    user: 'user_78234',
    amount: 25000.0,
    address: '0x8f3a...9c2d',
    status: 'pending',
    reviewer: '-',
    time: '2024-06-23 14:32:15',
  },
  {
    id: 'WTH-2024-002',
    user: 'user_45621',
    amount: 150000.5,
    address: '0xa1b2...c3d4',
    status: 'reviewing',
    reviewer: 'admin_zhang',
    time: '2024-06-23 14:18:42',
  },
  {
    id: 'WTH-2024-003',
    user: 'user_12876',
    amount: 50000.0,
    address: '0x9876...5432',
    status: 'approved',
    reviewer: 'admin_li',
    time: '2024-06-23 14:05:08',
  },
  {
    id: 'WTH-2024-004',
    user: 'user_89342',
    amount: 80000.75,
    address: '0x1122...3344',
    status: 'completed',
    reviewer: 'admin_wang',
    time: '2024-06-23 13:52:33',
  },
  {
    id: 'WTH-2024-005',
    user: 'user_34567',
    amount: 35000.25,
    address: '0xffee...ddcc',
    status: 'rejected',
    reviewer: 'admin_zhao',
    time: '2024-06-23 13:38:57',
  },
  {
    id: 'WTH-2024-006',
    user: 'user_67890',
    amount: 200000.0,
    address: '0xcafe...babe',
    status: 'pending',
    reviewer: '-',
    time: '2024-06-23 13:25:22',
  },
  {
    id: 'WTH-2024-007',
    user: 'user_11111',
    amount: 12000.5,
    address: '0x1234...5678',
    status: 'reviewing',
    reviewer: 'admin_qian',
    time: '2024-06-23 13:12:46',
  },
  {
    id: 'WTH-2024-008',
    user: 'user_22222',
    amount: 95000.0,
    address: '0xabcd...efgh',
    status: 'approved',
    reviewer: 'admin_sun',
    time: '2024-06-23 12:59:11',
  },
  {
    id: 'WTH-2024-009',
    user: 'user_33333',
    amount: 45000.75,
    address: '0x9876...abcd',
    status: 'completed',
    reviewer: 'admin_li',
    time: '2024-06-23 12:45:36',
  },
  {
    id: 'WTH-2024-010',
    user: 'user_44444',
    amount: 67000.25,
    address: '0xaaab...ccdd',
    status: 'pending',
    reviewer: '-',
    time: '2024-06-23 12:32:01',
  },
  {
    id: 'WTH-2024-011',
    user: 'user_55555',
    amount: 180000.0,
    address: '0xbbbc...cdee',
    status: 'rejected',
    reviewer: 'admin_zhou',
    time: '2024-06-23 12:18:26',
  },
  {
    id: 'WTH-2024-012',
    user: 'user_66666',
    amount: 28000.5,
    address: '0xccdd...eeff',
    status: 'reviewing',
    reviewer: 'admin_wu',
    time: '2024-06-23 12:04:51',
  },
];

export default function WithdrawManagementPage() {
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      pending: { color: 'orange', text: '待审核' },
      reviewing: { color: 'blue', text: '审核中' },
      approved: { color: 'cyan', text: '已通过' },
      completed: { color: 'green', text: '已完成' },
      rejected: { color: 'red', text: '已拒绝' },
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
          {text}
        </Text>
      ),
    },
    {
      title: '用户',
      dataIndex: 'user',
      key: 'user',
      width: 110,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '金额(USDT)',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount: number) => (
        <Text strong style={{ color: '#DC2626', fontSize: 15 }}>
          ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '提现地址',
      dataIndex: 'address',
      key: 'address',
      width: 140,
      render: (addr: string) => <Text code style={{ fontSize: 12 }}>{addr}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusTag(status),
    },
    {
      title: '审核人',
      dataIndex: 'reviewer',
      key: 'reviewer',
      width: 110,
      render: (text: string) => <Text>{text === '-' ? <Text type="secondary">待分配</Text> : text}</Text>,
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 160,
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
      onClick: (record: any) => console.log('通过:', record.id),
    },
    {
      key: 'reject',
      label: '拒绝',
      icon: <CloseOutlined />,
      type: 'link',
      danger: true,
      hidden: (record: any) => !['pending', 'reviewing'].includes(record.status),
      onClick: (record: any) => console.log('拒绝:', record.id),
    },
  ];

  const pendingCount = mockWithdrawData.filter((w) => w.status === 'pending').length;
  const todayTotal = mockWithdrawData.reduce((sum, w) => sum + w.amount, 0);
  const largeAmountCount = mockWithdrawData.filter((w) => w.amount >= 100000).length;
  const approvedRate = ((mockWithdrawData.filter((w) => ['approved', 'completed'].includes(w.status)).length / mockWithdrawData.length) * 100).toFixed(1);

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
            dataSource={mockWithdrawData}
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
