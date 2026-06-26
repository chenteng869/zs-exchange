'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Form, Input, Select, DatePicker, Statistic } from 'antd';
import { DollarOutlined, SendOutlined, ReloadOutlined, CheckCircleOutlined, ClockCircleOutlined, AlertOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface RewardRecord {
  id: string;
  userId: string;
  poolName: string;
  token: string;
  amount: string;
  period: string;
  status: string;
  paidAt: string;
  txHash: string;
}

const mockRewards: RewardRecord[] = [
  { id: '1', userId: 'usr-001', poolName: 'GXT 质押池', token: 'GXT', amount: '150', period: '2026-05-01 ~ 2026-05-15', status: 'paid', paidAt: '2026-05-15 10:00:00', txHash: '0xabc123...' },
  { id: '2', userId: 'usr-002', poolName: 'ETH 质押池', token: 'ETH', amount: '0.1', period: '2026-05-01 ~ 2026-05-15', status: 'paid', paidAt: '2026-05-15 10:05:00', txHash: '0xdef456...' },
  { id: '3', userId: 'usr-003', poolName: 'BTC 质押池', token: 'BTC', amount: '0.05', period: '2026-05-01 ~ 2026-05-15', status: 'pending', paidAt: '-', txHash: '-' },
  { id: '4', userId: 'usr-004', poolName: 'USDT 稳定池', token: 'USDT', amount: '500', period: '2026-05-01 ~ 2026-05-15', status: 'paid', paidAt: '2026-05-15 10:10:00', txHash: '0xghi789...' },
  { id: '5', userId: 'usr-005', poolName: 'GXT 质押池', token: 'GXT', amount: '300', period: '2026-04-01 ~ 2026-04-30', status: 'failed', paidAt: '2026-05-01 10:00:00', txHash: '0xjkl012...' },
  { id: '6', userId: 'usr-006', poolName: 'ETH 质押池', token: 'ETH', amount: '0.15', period: '2026-05-01 ~ 2026-05-15', status: 'paid', paidAt: '2026-05-15 10:15:00', txHash: '0xmno345...' },
  { id: '7', userId: 'usr-007', poolName: 'GXT 质押池', token: 'GXT', amount: '75', period: '2026-05-01 ~ 2026-05-15', status: 'paid', paidAt: '2026-05-15 10:20:00', txHash: '0xpqr678...' },
  { id: '8', userId: 'usr-008', poolName: 'BTC 质押池', token: 'BTC', amount: '0.02', period: '2026-05-01 ~ 2026-05-15', status: 'pending', paidAt: '-', txHash: '-' },
  { id: '9', userId: 'usr-009', poolName: 'USDT 稳定池', token: 'USDT', amount: '1200', period: '2026-04-01 ~ 2026-04-30', status: 'paid', paidAt: '2026-05-01 10:30:00', txHash: '0xstu901...' },
  { id: '10', userId: 'usr-010', poolName: 'GXT 质押池', token: 'GXT', amount: '675', period: '2026-04-01 ~ 2026-04-30', status: 'paid', paidAt: '2026-05-01 10:35:00', txHash: '0xvwx234...' },
];

export default function RewardsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');

  const columns = [
    { title: '用户ID', dataIndex: 'userId', key: 'userId', render: (text: string) => <span className="font-mono text-sm">{text}</span> },
    { title: '矿池', dataIndex: 'poolName', key: 'poolName' },
    { title: '奖励代币', dataIndex: 'token', key: 'token', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: '奖励数量', dataIndex: 'amount', key: 'amount', render: (text: string, record: RewardRecord) => `${text} ${record.token}` },
    { title: '结算周期', dataIndex: 'period', key: 'period' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          paid: 'green',
          pending: 'orange',
          failed: 'red'
        };
        const icons: Record<string, React.ReactNode> = {
          paid: <CheckCircleOutlined />,
          pending: <ClockCircleOutlined />,
          failed: <AlertOutlined />
        };
        const labels: Record<string, string> = {
          paid: '已发放',
          pending: '待发放',
          failed: '发放失败'
        };
        return <Tag icon={icons[status]} color={colors[status] || 'gray'}>{labels[status] || status}</Tag>;
      }
    },
    { title: '发放时间', dataIndex: 'paidAt', key: 'paidAt', render: (text: string) => text === '-' ? <span className="text-gray-400">等待中</span> : text },
    { title: '交易哈希', dataIndex: 'txHash', key: 'txHash', render: (text: string) => text === '-' ? '-' : <span className="font-mono text-sm text-blue-600 cursor-pointer hover:underline">{text}</span> },
  ];

  const totalRewards = '1,000,500 GXT';
  const paidCount = mockRewards.filter(r => r.status === 'paid').length;
  const pendingCount = mockRewards.filter(r => r.status === 'pending').length;
  const failedCount = mockRewards.filter(r => r.status === 'failed').length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarOutlined className="text-2xl text-green-600" />
            <h1 className="text-2xl font-bold m-0">收益发放</h1>
          </div>
          <Space>
            <Select 
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              style={{ width: 150 }}
            >
              <Option value="daily">今日</Option>
              <Option value="weekly">本周</Option>
              <Option value="monthly">本月</Option>
              <Option value="custom">自定义</Option>
            </Select>
            <Button type="primary" icon={<SendOutlined />}>批量发放</Button>
            <Button icon={<ReloadOutlined />}>刷新</Button>
          </Space>
        </div>

        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic title="累计发放奖励" value={totalRewards} prefix={<DollarOutlined />} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="已发放" value={paidCount} suffix="笔" valueStyle={{ color: '#1677FF' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="待发放" value={pendingCount} suffix="笔" valueStyle={{ color: '#F59E0B' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="发放失败" value={failedCount} suffix="笔" valueStyle={{ color: '#DC2626' }} />
            </Card>
          </Col>
        </Row>

        <Card>
          <div className="flex gap-4 mb-4">
            <Form layout="inline">
              <Form.Item>
                <Select placeholder="筛选状态" style={{ width: 150 }}>
                  <Option value="all">全部</Option>
                  <Option value="paid">已发放</Option>
                  <Option value="pending">待发放</Option>
                  <Option value="failed">发放失败</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Select placeholder="筛选矿池" style={{ width: 150 }}>
                  <Option value="all">全部矿池</Option>
                  <Option value="GXT 质押池">GXT 质押池</Option>
                  <Option value="ETH 质押池">ETH 质押池</Option>
                  <Option value="BTC 质押池">BTC 质押池</Option>
                  <Option value="USDT 稳定池">USDT 稳定池</Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <RangePicker style={{ width: 250 }} />
              </Form.Item>
            </Form>
          </div>

          <Table
            dataSource={mockRewards}
            columns={columns}
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条记录` }}
            rowKey="id"
          />
        </Card>
      </div>
    </AdminLayout>
  );
}