'use client';

import React, { useState } from 'react';
import { Card, Typography, Tag, Row, Col, Progress, Badge, Space, Tooltip, Divider } from 'antd';
import {
  DollarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WalletOutlined,
  TeamOutlined,
  RiseOutlined,
  EyeOutlined,
  FileTextOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

interface CommissionRecord {
  id: string;
  settlementNo: string;
  node: string;
  nodeId: string;
  period: string;
  baseAmount: number;
  commissionRate: number;
  commissionAmount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
}

const mockCommissions: CommissionRecord[] = [
  {
    id: '1',
    settlementNo: 'SET-202406-001',
    node: '张伟',
    nodeId: 'ND-2024-001',
    period: '2024年6月',
    baseAmount: 1250000,
    commissionRate: 30,
    commissionAmount: 375000,
    status: 'completed',
    progress: 100,
  },
  {
    id: '2',
    settlementNo: 'SET-202406-002',
    node: '李娜',
    nodeId: 'ND-2024-002',
    period: '2024年6月',
    baseAmount: 890000,
    commissionRate: 20,
    commissionAmount: 178000,
    status: 'completed',
    progress: 100,
  },
  {
    id: '3',
    settlementNo: 'SET-202406-003',
    node: '王强',
    nodeId: 'ND-2024-003',
    period: '2024年6月',
    baseAmount: 560000,
    commissionRate: 15,
    commissionAmount: 84000,
    status: 'processing',
    progress: 65,
  },
  {
    id: '4',
    settlementNo: 'SET-202406-004',
    node: '刘芳',
    nodeId: 'ND-2024-004',
    period: '2024年6月',
    baseAmount: 340000,
    commissionRate: 10,
    commissionAmount: 34000,
    status: 'pending',
    progress: 0,
  },
  {
    id: '5',
    settlementNo: 'SET-202406-005',
    node: '陈明',
    nodeId: 'ND-2024-005',
    period: '2024年6月',
    baseAmount: 180000,
    commissionRate: 10,
    commissionAmount: 18000,
    status: 'pending',
    progress: 0,
  },
  {
    id: '6',
    settlementNo: 'SET-202406-006',
    node: '杨丽',
    nodeId: 'ND-2024-006',
    period: '2024年6月',
    baseAmount: 720000,
    commissionRate: 20,
    commissionAmount: 144000,
    status: 'processing',
    progress: 42,
  },
  {
    id: '7',
    settlementNo: 'SET-202406-007',
    node: '赵刚',
    nodeId: 'ND-2024-007',
    period: '2024年6月',
    baseAmount: 450000,
    commissionRate: 15,
    commissionAmount: 67500,
    status: 'pending',
    progress: 0,
  },
  {
    id: '8',
    settlementNo: 'SET-202406-008',
    node: '孙静',
    nodeId: 'ND-2024-008',
    period: '2024年6月',
    baseAmount: 280000,
    commissionRate: 10,
    commissionAmount: 28000,
    status: 'completed',
    progress: 100,
  },
  {
    id: '9',
    settlementNo: 'SET-202406-009',
    node: '吴敏',
    nodeId: 'ND-2024-010',
    period: '2024年6月',
    baseAmount: 1100000,
    commissionRate: 30,
    commissionAmount: 330000,
    status: 'processing',
    progress: 78,
  },
  {
    id: '10',
    settlementNo: 'SET-202406-010',
    node: '郑华',
    nodeId: 'ND-2024-011',
    period: '2024年6月',
    baseAmount: 480000,
    commissionRate: 15,
    commissionAmount: 72000,
    status: 'pending',
    progress: 0,
  },
  {
    id: '11',
    settlementNo: 'SET-202406-011',
    node: '黄磊',
    nodeId: 'ND-2024-012',
    period: '2024年6月',
    baseAmount: 125000,
    commissionRate: 10,
    commissionAmount: 12500,
    status: 'failed',
    progress: 35,
  },
  {
    id: '12',
    settlementNo: 'SET-202405-045',
    node: '周涛',
    nodeId: 'ND-2024-009',
    period: '2024年5月',
    baseAmount: 95000,
    commissionRate: 10,
    commissionAmount: 9500,
    status: 'completed',
    progress: 100,
  },
];

const getStatusConfig = (status: string) => {
  const map: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
    pending: { color: 'default', text: '待结算', icon: <ClockCircleOutlined /> },
    processing: { color: 'processing', text: '结算中', icon: <WalletOutlined /> },
    completed: { color: 'success', text: '已完成', icon: <CheckCircleOutlined /> },
    failed: { color: 'error', text: '异常', icon: <AlertOutlined /> },
  };
  return map[status] || { color: 'default', text: status, icon: <ClockCircleOutlined /> };
};

const getProgressColor = (status: string) => {
  const map: Record<string, string> = {
    pending: '#D1D5DB',
    processing: '#1677FF',
    completed: '#16A34A',
    failed: '#DC2626',
  };
  return map[status] || '#1677FF';
};

export default function DsalesCommissionPage() {
  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      type: 'link',
      onClick: (record: CommissionRecord) =>
        console.log('查看结算详情:', record.settlementNo),
      hidden: () => false,
    },
    {
      key: 'download',
      label: '下载凭证',
      icon: <FileTextOutlined />,
      type: 'link',
      onClick: (record: CommissionRecord) =>
        console.log('下载凭证:', record.settlementNo),
      hidden: (record: CommissionRecord) => record.status !== 'completed',
    },
  ];

  const columns = [
    {
      title: '结算单号',
      dataIndex: 'settlementNo',
      key: 'settlementNo',
      width: 160,
      render: (text: string) => <Text code>{text}</Text>,
    },
    {
      title: '节点',
      dataIndex: 'node',
      key: 'node',
      width: 100,
      render: (text: string, record: CommissionRecord) => (
        <Space>
          <Text strong>{text}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>{record.nodeId}</Text>
        </Space>
      ),
    },
    {
      title: '结算周期',
      dataIndex: 'period',
      key: 'period',
      width: 120,
    },
    {
      title: '业绩基数(USDT)',
      dataIndex: 'baseAmount',
      key: 'baseAmount',
      width: 160,
      sorter: (a: CommissionRecord, b: CommissionRecord) =>
        a.baseAmount - b.baseAmount,
      render: (val: number) => (
        <Text>${val.toLocaleString()}</Text>
      ),
    },
    {
      title: '佣金比例',
      dataIndex: 'commissionRate',
      key: 'commissionRate',
      width: 100,
      render: (val: number) => (
        <Tag color="blue">{val}%</Tag>
      ),
    },
    {
      title: '应发金额(USDT)',
      dataIndex: 'commissionAmount',
      key: 'commissionAmount',
      width: 150,
      sorter: (a: CommissionRecord, b: CommissionRecord) =>
        a.commissionAmount - b.commissionAmount,
      render: (val: number) => (
        <Text strong style={{ color: '#F0B90B', fontSize: 15 }}>
          ${val.toLocaleString()}
        </Text>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => {
        const config = getStatusConfig(status);
        return (
          <Tag icon={config.icon} color={config.color}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: '结算进度',
      dataIndex: 'progress',
      key: 'progress',
      width: 180,
      render: (progress: number, record: CommissionRecord) => (
        <Tooltip title={`${progress}%`}>
          <Progress
            percent={progress}
            size="small"
            strokeColor={getProgressColor(record.status)}
            format={(percent) => `${percent}%`}
          />
        </Tooltip>
      ),
    },
  ];

  const totalPending = mockCommissions
    .filter((item) => item.status === 'pending')
    .reduce((sum, item) => sum + item.commissionAmount, 0);

  const totalCompleted = mockCommissions
    .filter((item) => item.status === 'completed')
    .reduce((sum, item) => sum + item.commissionAmount, 0);

  return (
    <div className="space-y-6">
      {/* 页面标题区 */}
      <div>
        <Title level={2} style={{ marginBottom: 4 }}>
          佣金结算中心
        </Title>
        <Text type="secondary">自动计算 · 分期发放 · 透明可追溯</Text>
      </div>

      {/* 数据统计卡片 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="待结算佣金"
            value={`$${(totalPending / 10000).toFixed(1)}万`}
            icon={<ClockCircleOutlined />}
            color="#F59E0B"
            trend="down"
            trendValue="-5.2%"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="已结算总额"
            value={`$${(totalCompleted / 10000).toFixed(1)}万`}
            icon={<CheckCircleOutlined />}
            color="#16A34A"
            trend="up"
            trendValue="+18.7%"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="本月发放"
            value="$89.5万"
            icon={<WalletOutlined />}
            color="#F0B90B"
            trend="up"
            trendValue="+12.3%"
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <DataCard
            title="结算人数"
            value={156}
            icon={<TeamOutlined />}
            color="#1677FF"
            suffix="人"
            trend="up"
            trendValue="+8人"
          />
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <DataCard
            title="平均佣金"
            value="$5,738"
            icon={<RiseOutlined />}
            color="#7C3AED"
            description="本月人均结算金额"
          />
        </Col>
      </Row>

      {/* 结算概览 */}
      <Row gutter={[16, 16]} className="mb-4">
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Badge count={mockCommissions.filter((i) => i.status === 'pending').length} offset={[-5, 5]}>
              <Text type="secondary">待处理</Text>
            </Badge>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#F59E0B', marginTop: 8 }}>
              {mockCommissions.filter((i) => i.status === 'pending').length}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Badge count={mockCommissions.filter((i) => i.status === 'processing').length} offset={[-5, 5]}>
              <Text type="secondary">处理中</Text>
            </Badge>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#1677FF', marginTop: 8 }}>
              {mockCommissions.filter((i) => i.status === 'processing').length}
            </div>
          </Card>
        </Col>
        <Col span={8}>
          <Card size="small" style={{ textAlign: 'center' }}>
            <Badge count={mockCommissions.filter((i) => i.status === 'completed').length} offset={[-5, 5]}>
              <Text type="secondary">已完成</Text>
            </Badge>
            <div style={{ fontSize: 24, fontWeight: 600, color: '#16A34A', marginTop: 8 }}>
              {mockCommissions.filter((i) => i.status === 'completed').length}
            </div>
          </Card>
        </Col>
      </Row>

      {/* 结算记录表格 */}
      <Card bordered={false} style={{ borderRadius: 12 }}>
        <DataTable
          title="结算记录"
          columns={columns}
          dataSource={mockCommissions}
          rowKey="id"
          actions={actions}
          searchPlaceholder="搜索结算单号或节点..."
          showFilter={true}
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '待结算', value: 'pending' },
            { label: '结算中', value: 'processing' },
            { label: '已完成', value: 'completed' },
            { label: '异常', value: 'failed' },
          ]}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条结算记录`,
          }}
        />
      </Card>
    </div>
  );
}
