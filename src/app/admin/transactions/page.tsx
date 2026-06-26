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
  SwapOutlined,
  CalculatorOutlined,
  CheckCircleOutlined,
  FieldTimeOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

const mockTransactionData = [
  {
    id: 1,
    txHash: '0x8f3a9c2d1e4b5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f',
    type: 'Transfer',
    from: '0x1234...abcd',
    to: '0x5678...efgh',
    amount: 125.5,
    token: 'USDT',
    time: '2024-06-23 14:32:15',
    status: 'confirmed',
  },
  {
    id: 2,
    txHash: '0xa1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456',
    type: 'Swap',
    from: '0xabcd...1234',
    to: '0xefgh...5678',
    amount: 2.35,
    token: 'ETH',
    time: '2024-06-23 14:28:42',
    status: 'pending',
  },
  {
    id: 3,
    txHash: '0x9876543210fedcba0987654321fedcba0987654321fedcba0987654321f',
    type: 'Approval',
    from: '0xdef0...7890',
    to: '0x3456...ijkl',
    amount: 50000,
    token: 'USDC',
    time: '2024-06-23 14:25:08',
    status: 'confirmed',
  },
  {
    id: 4,
    txHash: '0x11223344556677889900aabbccddeeff11223344556677889900aabbccdd',
    type: 'Transfer',
    from: '0xmnop...qrst',
    to: '0xuvwx...yz01',
    amount: 892.75,
    token: 'BNB',
    time: '2024-06-23 14:21:33',
    status: 'failed',
  },
  {
    id: 5,
    txHash: '0xffeeddccbbaa99887766554433221100ffeeddccbbaa99887766554433221',
    type: 'Swap',
    from: '0x2345...6789',
    to: '0x8901...2345',
    amount: 156.0,
    token: 'BTC',
    time: '2024-06-23 14:18:57',
    status: 'confirmed',
  },
  {
    id: 6,
    txHash: '0xcafebabedeadbeefcafebabedeadbeefcafebabedeadbeefcafebabedead',
    type: 'Mint',
    from: '0x6789...0123',
    to: '0xcdef...4567',
    amount: 10,
    token: 'NFT',
    time: '2024-06-23 14:15:22',
    status: 'pending',
  },
  {
    id: 7,
    txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcde',
    type: 'Stake',
    from: '0xfghi...jklm',
    to: '0x7890...1234',
    amount: 1000,
    token: 'ETH',
    time: '2024-06-23 14:12:46',
    status: 'confirmed',
  },
  {
    id: 8,
    txHash: '0xabcdef0123456789abcdef0123456789abcdef0123456789abcdef01234567',
    type: 'Transfer',
    from: '0xnoqr...stuv',
    to: '0wxyz...1234',
    amount: 45678.25,
    token: 'USDT',
    time: '2024-06-23 14:09:11',
    status: 'confirmed',
  },
  {
    id: 9,
    txHash: '0x9876543210abcdef9876543210abcdef9876543210abcdef9876543210ab',
    type: 'Swap',
    from: '0x3456...7890',
    to: '0xabcd...efgh',
    amount: 50.5,
    token: 'SOL',
    time: '2024-06-23 14:05:36',
    status: 'pending',
  },
  {
    id: 10,
    txHash: '0xaaaabbbbccccddddeeeeffff0000111122223333444455556666777788889999',
    type: 'Bridge',
    from: '0xijkl...mnop',
    to: '0qrst...uvwx',
    amount: 2500,
    token: 'USDC',
    time: '2024-06-23 14:02:01',
    status: 'processing',
  },
  {
    id: 11,
    txHash: '0xbbbbccccddddeeeeefffff000001111222233334444555566667777888899990000',
    type: 'Transfer',
    from: '0yz01...2345',
    to: '0x6789...abcd',
    amount: 7890.0,
    token: 'MATIC',
    time: '2024-06-23 13:58:26',
    status: 'confirmed',
  },
  {
    id: 12,
    txHash: '0xccccddddeeeeefffff00000111122223333444455556666777788889999000011112222',
    type: 'Burn',
    from: '0x4567...8901',
    to: '0x2345...6789',
    amount: 100,
    token: 'LP',
    time: '2024-06-23 13:54:51',
    status: 'confirmed',
  },
  {
    id: 13,
    txHash: '0xdddeeeefffff0000011112222333344445555666677778888999900001111222233334444',
    type: 'Swap',
    from: '0x8901...2345',
    to: '0xdef0...6789',
    amount: 320.75,
    token: 'AVAX',
    time: '2024-06-23 13:51:16',
    status: 'failed',
  },
  {
    id: 14,
    txHash: '0xeeefffff000001111222233334444555566667777888899990000111122223333444455556666',
    type: 'Transfer',
    from: '0xabcd...efgh',
    to: '0xghij...klmn',
    amount: 12500,
    token: 'DAI',
    time: '2024-06-23 13:47:41',
    status: 'confirmed',
  },
  {
    id: 15,
    txHash: '0xffff0000011112222333344445555666677778888999900001111222233334444555566667777888899',
    type: 'Claim',
    from: '0xijkl...mnop',
    to: '0xpqrs...tuvw',
    amount: 150.25,
    token: 'ARB',
    time: '2024-06-23 13:44:06',
    status: 'pending',
  },
];

export default function TransactionsOverviewPage() {
  const getStatusTag = (status: string) => {
    const statusMap: Record<string, { color: string; text: string }> = {
      confirmed: { color: 'success', text: '已确认' },
      pending: { color: 'warning', text: '待确认' },
      processing: { color: 'blue', text: '处理中' },
      failed: { color: 'error', text: '失败' },
    };
    const config = statusMap[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  const getTypeTag = (type: string) => {
    const typeColors: Record<string, string> = {
      Transfer: 'blue',
      Swap: 'green',
      Approval: 'orange',
      Mint: 'purple',
      Stake: 'cyan',
      Bridge: 'magenta',
      Burn: 'red',
      Claim: 'gold',
    };
    return <Tag color={typeColors[type] || 'default'}>{type}</Tag>;
  };

  const truncateHash = (hash: string) => `${hash.slice(0, 10)}...${hash.slice(-8)}`;

  const columns = [
    {
      title: 'TX Hash',
      dataIndex: 'txHash',
      key: 'txHash',
      width: 200,
      render: (hash: string) => (
        <Space>
          <Text code style={{ fontSize: 12 }}>{truncateHash(hash)}</Text>
          <LinkOutlined
            style={{ fontSize: 12, color: '#1677FF' }}
            onClick={() => window.open(`https://etherscan.io/tx/${hash}`, '_blank')}
          />
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (type: string) => getTypeTag(type),
    },
    {
      title: 'From',
      dataIndex: 'from',
      key: 'from',
      width: 140,
      render: (addr: string) => <Text code style={{ fontSize: 12 }}>{addr}</Text>,
    },
    {
      title: 'To',
      dataIndex: 'to',
      key: 'to',
      width: 140,
      render: (addr: string) => <Text code style={{ fontSize: 12 }}>{addr}</Text>,
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount: number, record: any) => (
        <Text strong>
          {amount.toLocaleString('en-US', { maximumFractionDigits: 4 })} {record.token}
        </Text>
      ),
    },
    {
      title: 'Token',
      dataIndex: 'token',
      key: 'token',
      width: 80,
    },
    {
      title: 'Time',
      dataIndex: 'time',
      key: 'time',
      width: 150,
    },
    {
      title: 'Status',
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

  const totalVolume = mockTransactionData.reduce((sum, tx) => sum + tx.amount, 0);
  const successRate = ((mockTransactionData.filter((tx) => tx.status === 'confirmed').length / mockTransactionData.length) * 100).toFixed(1);

  return (
    <AdminLayout>
      <div className="p-6" style={{ background: '#F5F7FA', minHeight: '100vh' }}>
        {/* 页面标题 */}
        <div className="mb-6">
          <Title level={2} style={{ margin: 0, color: '#111827' }}>
            全量交易监控中心
          </Title>
          <Text type="secondary" style={{ fontSize: 14, marginTop: 8, display: 'block' }}>
            实时链上交易监控 · 多链数据聚合 · 智能风控预警
          </Text>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="今日交易总额"
              value={totalVolume.toLocaleString('en-US', { maximumFractionDigits: 2 })}
              suffix="USDT"
              icon={<DollarOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+28.5%"
              description="交易活跃"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="交易笔数"
              value={mockTransactionData.length * 100}
              suffix="笔"
              icon={<SwapOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+15.3%"
              description="持续增长"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="平均金额"
              value={(totalVolume / mockTransactionData.length).toFixed(2)}
              suffix="USDT"
              icon={<CalculatorOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+8.7%"
              description="大额增加"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="成功率"
              value={successRate}
              suffix="%"
              icon={<CheckCircleOutlined />}
              color="#06B6D4"
              trend="up"
              trendValue="+2.1%"
              description="网络稳定"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="确认延迟"
              value={12.5}
              suffix="秒"
              icon={<FieldTimeOutlined />}
              color="#F59E0B"
              trend="down"
              trendValue="-15%"
              description="效率提升"
            />
          </Col>
          <Col xs={24} sm={12} lg={8} xl={4}>
            <DataCard
              title="Gas消耗"
              value={0.0025}
              suffix="ETH"
              icon={<ThunderboltOutlined />}
              color="#DC2626"
              trend="down"
              trendValue="-8.3%"
              description="成本优化"
            />
          </Col>
        </Row>

        {/* 交易列表表格 */}
        <Card
          bordered={false}
          style={{
            borderRadius: 12,
            boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
          }}
        >
          <DataTable
            columns={columns}
            dataSource={mockTransactionData}
            title="实时交易流"
            rowKey="id"
            actions={actions}
            showAdd={false}
            searchPlaceholder="搜索TX Hash或地址..."
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条交易`,
            }}
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
