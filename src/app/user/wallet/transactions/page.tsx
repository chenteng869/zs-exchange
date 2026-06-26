'use client';

import { useState } from 'react';
import { Card, Table, Tag, Button, Space, Select, DatePicker, Input, Row, Col } from 'antd';
import { SearchOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import UserLayout from '@/components/user/UserLayout';

const { RangePicker } = DatePicker;
const { Option } = Select;

const mockTransactions = [
  { id: '1', hash: '0x1234...5678abcdef', type: 'deposit', token: 'ETH', amount: 1.5, from: '0xabc...def', to: '0x123...456', time: '2026-05-13 10:30:00', status: 'success', gasFee: 0.002 },
  { id: '2', hash: '0xabc1...def2fedcba', type: 'swap', token: 'GXT', amount: 5000, from: '0x123...456', to: '0x789...0ab', time: '2026-05-13 09:15:00', status: 'success', gasFee: 0.0015 },
  { id: '3', hash: '0x9876...54321098', type: 'withdraw', token: 'USDT', amount: 1000, from: '0x123...456', to: '0xcde...fgh', time: '2026-05-12 16:45:00', status: 'pending', gasFee: 0.001 },
  { id: '4', hash: '0x1111...22223333', type: 'staking', token: 'GXT', amount: 10000, from: '0x123...456', to: '0xijk...lmn', time: '2026-05-12 14:20:00', status: 'success', gasFee: 0.0018 },
  { id: '5', hash: '0x3333...44445555', type: 'reward', token: 'GXT', amount: 125.5, from: '0xopq...rst', to: '0x123...456', time: '2026-05-12 08:00:00', status: 'success', gasFee: 0 },
  { id: '6', hash: '0x5555...66667777', type: 'transfer', token: 'ETH', amount: 0.1, from: '0x123...456', to: '0xuvw...xyz', time: '2026-05-11 20:30:00', status: 'success', gasFee: 0.0012 },
  { id: '7', hash: '0x7777...88889999', type: 'nft', token: 'NFT', amount: 1, from: '0x123...456', to: '0xzzz...aaa', time: '2026-05-11 15:10:00', status: 'failed', gasFee: 0.0025 },
  { id: '8', hash: '0x9999...0000aaaa', type: 'lending', token: 'USDC', amount: 5000, from: '0x123...456', to: '0xbbb...ccc', time: '2026-05-10 12:00:00', status: 'success', gasFee: 0.0016 },
];

export default function UserWalletTransactions() {
  const [transactions] = useState(mockTransactions);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => {
        const typeMap: Record<string, { color: string; text: string }> = {
          deposit: { color: 'blue', text: '充值' },
          withdraw: { color: 'orange', text: '提现' },
          swap: { color: 'purple', text: '兑换' },
          staking: { color: 'green', text: '质押' },
          reward: { color: 'gold', text: '奖励' },
          transfer: { color: 'cyan', text: '转账' },
          nft: { color: 'magenta', text: 'NFT' },
          lending: { color: 'geekblue', text: '借贷' },
        };
        const t = typeMap[type] || { color: 'default', text: type };
        return <Tag color={t.color}>{t.text}</Tag>;
      },
    },
    {
      title: '交易哈希',
      dataIndex: 'hash',
      key: 'hash',
      width: 180,
      render: (hash: string) => (
        <a href={`https://etherscan.io/tx/${hash}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 font-mono text-sm">
          {hash}
        </a>
      ),
    },
    {
      title: '代币',
      dataIndex: 'token',
      key: 'token',
      width: 100,
      render: (token: string) => <Tag color="default">{token}</Tag>,
    },
    {
      title: '数量',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (val: number) => (
        <div className="font-semibold">{val.toLocaleString()}</div>
      ),
    },
    {
      title: '发送方',
      dataIndex: 'from',
      key: 'from',
      width: 130,
      render: (addr: string) => <span className="font-mono text-xs text-gray-600">{addr}</span>,
    },
    {
      title: '接收方',
      dataIndex: 'to',
      key: 'to',
      width: 130,
      render: (addr: string) => <span className="font-mono text-xs text-gray-600">{addr}</span>,
    },
    {
      title: 'Gas费',
      dataIndex: 'gasFee',
      key: 'gasFee',
      width: 100,
      render: (fee: number) => <span className="text-gray-600">{fee} ETH</span>,
    },
    {
      title: '时间',
      dataIndex: 'time',
      key: 'time',
      width: 180,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          success: { color: 'success', text: '成功' },
          pending: { color: 'processing', text: '处理中' },
          failed: { color: 'error', text: '失败' },
        };
        const s = statusMap[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: () => <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>,
    },
  ];

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold m-0">交易记录</h1>
          <Button icon={<DownloadOutlined />}>导出</Button>
        </div>

        <Card>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="交易类型"
                style={{ width: '100%' }}
                value={filterType}
                onChange={setFilterType}
              >
                <Option value="all">全部类型</Option>
                <Option value="deposit">充值</Option>
                <Option value="withdraw">提现</Option>
                <Option value="swap">兑换</Option>
                <Option value="staking">质押</Option>
                <Option value="transfer">转账</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Select
                placeholder="交易状态"
                style={{ width: '100%' }}
                value={filterStatus}
                onChange={setFilterStatus}
              >
                <Option value="all">全部状态</Option>
                <Option value="success">成功</Option>
                <Option value="pending">处理中</Option>
                <Option value="failed">失败</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8} md={6}>
              <RangePicker style={{ width: '100%' }} placeholder={['开始时间', '结束时间']} />
            </Col>
            <Col xs={24} sm={8} md={6}>
              <Input.Search placeholder="搜索地址/哈希" prefix={<SearchOutlined />} />
            </Col>
          </Row>
        </Card>

        <Card>
          <Table
            dataSource={transactions}
            columns={columns}
            pagination={{
              pageSize: 15,
              showTotal: (total, range) => `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
              showSizeChanger: true,
              showQuickJumper: true,
            }}
            rowKey="id"
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>
    </UserLayout>
  );
}
