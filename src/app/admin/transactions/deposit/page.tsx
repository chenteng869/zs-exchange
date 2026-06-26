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

const mockDepositData = [
  {
    id: 'DEP-2024-001',
    user: 'user_78234',
    amount: 50000.0,
    network: 'TRC20',
    txHash: '0x8f3a...9c2d1e4b',
    status: 'success',
    time: '2024-06-23 14:32:15',
  },
  {
    id: 'DEP-2024-002',
    user: 'user_45621',
    amount: 25000.5,
    network: 'ERC20',
    txHash: '0xa1b2c3d4e5f6...',
    status: 'pending',
    time: '2024-06-23 14:18:42',
  },
  {
    id: 'DEP-2024-003',
    user: 'user_12876',
    amount: 100000.0,
    network: 'BEP20',
    txHash: '0x9876543210fe...',
    status: 'confirming',
    time: '2024-06-23 14:05:08',
  },
  {
    id: 'DEP-2024-004',
    user: 'user_89342',
    amount: 15000.75,
    network: 'TRC20',
    txHash: '0x112233445566...',
    status: 'success',
    time: '2024-06-23 13:52:33',
  },
  {
    id: 'DEP-2024-005',
    user: 'user_34567',
    amount: 75000.25,
    network: 'ERC20',
    txHash: '0xffeeddccbb aa99...',
    status: 'failed',
    time: '2024-06-23 13:38:57',
  },
  {
    id: 'DEP-2024-006',
    user: 'user_67890',
    amount: 32000.0,
    network: 'Polygon',
    txHash: '0xcafebabe dead...',
    status: 'pending',
    time: '2024-06-23 13:25:22',
  },
  {
    id: 'DEP-2024-007',
    user: 'user_11111',
    amount: 8900.5,
    network: 'Arbitrum',
    txHash: '0x1234567890ab...',
    status: 'success',
    time: '2024-06-23 13:12:46',
  },
  {
    id: 'DEP-2024-008',
    user: 'user_22222',
    amount: 156000.0,
    network: 'Optimism',
    txHash: '0xabcdef012345...',
    status: 'confirming',
    time: '2024-06-23 12:59:11',
  },
  {
    id: 'DEP-2024-009',
    user: 'user_33333',
    amount: 45000.75,
    network: 'TRC20',
    txHash: '0x9876543210ab...',
    status: 'success',
    time: '2024-06-23 12:45:36',
  },
  {
    id: 'DEP-2024-010',
    user: 'user_44444',
    amount: 67800.25,
    network: 'ERC20',
    txHash: '0xaaabbbcccddd...',
    status: 'pending',
    time: '2024-06-23 12:32:01',
  },
  {
    id: 'DEP-2024-011',
    user: 'user_55555',
    amount: 22000.0,
    network: 'BSC',
    txHash: '0xbbbcccddeeff...',
    status: 'failed',
    time: '2024-06-23 12:18:26',
  },
  {
    id: 'DEP-2024-012',
    user: 'user_66666',
    amount: 95000.5,
    network: 'Avalanche',
    txHash: '0xccdddeeeffff...',
    status: 'success',
    time: '2024-06-23 12:04:51',
  },
];

export default function DepositManagementPage() {
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

  const getNetworkColor = (network: string) => {
    const colorMap: Record<string, string> = {
      TRC20: '#F7931A',
      ERC20: '#627EEA',
      BEP20: '#F3BA2F',
      Polygon: '#8247E5',
      Arbitrum: '#28A0F0',
      Optimism: '#FF0420',
      BSC: '#F3BA2F',
      Avalanche: '#E84142',
    };
    return <Tag style={{ color: colorMap[network] || '#9CA3AF', borderColor: colorMap[network] || '#9CA3AF' }}>{network}</Tag>;
  };

  const columns = [
    {
      title: '订单号',
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
      width: 120,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '金额(USDT)',
      dataIndex: 'amount',
      key: 'amount',
      width: 140,
      render: (amount: number) => (
        <Text strong style={{ color: '#16A34A', fontSize: 15 }}>
          ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </Text>
      ),
    },
    {
      title: '网络',
      dataIndex: 'network',
      key: 'network',
      width: 110,
      render: (network: string) => getNetworkColor(network),
    },
    {
      title: 'TX哈希',
      dataIndex: 'txHash',
      key: 'txHash',
      width: 180,
      render: (hash: string) => (
        <Space>
          <Text code style={{ fontSize: 12 }}>{hash}</Text>
          <LinkOutlined
            style={{ fontSize: 12, color: '#1677FF' }}
            onClick={() => console.log('查看链上:', hash)}
          />
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
  ];

  const totalDeposit = mockDepositData
    .filter((d) => d.status === 'success')
    .reduce((sum, d) => sum + d.amount, 0);
  const pendingCount = mockDepositData.filter((d) => d.status === 'pending' || d.status === 'confirming').length;
  const failRate = ((mockDepositData.filter((d) => d.status === 'failed').length / mockDepositData.length) * 100).toFixed(1);

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
              value={mockDepositData.reduce((sum, d) => sum + d.amount, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
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
            dataSource={mockDepositData}
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
