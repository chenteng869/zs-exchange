'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Form, Input, Select, DatePicker } from 'antd';
import { EyeOutlined, SearchOutlined, HistoryOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface StakingRecord {
  id: string;
  userId: string;
  userAddress: string;
  poolName: string;
  token: string;
  amount: string;
  stakedAt: string;
  expiresAt: string;
  status: string;
  rewards: string;
}

const mockRecords: StakingRecord[] = [
  { id: '1', userId: 'usr-001', userAddress: '0x742d35Cc...22A8', poolName: 'GXT 质押池', token: 'GXT', amount: '5000', stakedAt: '2026-05-10 10:30:00', expiresAt: '2026-06-10 10:30:00', status: 'staking', rewards: '150 GXT' },
  { id: '2', userId: 'usr-002', userAddress: '0x1a2b3c4d...r9s0t', poolName: 'ETH 质押池', token: 'ETH', amount: '5.5', stakedAt: '2026-05-08 14:15:00', expiresAt: '2026-08-08 14:15:00', status: 'staking', rewards: '0.1 ETH' },
  { id: '3', userId: 'usr-003', userAddress: 'bc1qxy2kg...hx0wlh', poolName: 'BTC 质押池', token: 'BTC', amount: '2.5', stakedAt: '2026-04-15 09:00:00', expiresAt: '2026-10-15 09:00:00', status: 'staking', rewards: '0.05 BTC' },
  { id: '4', userId: 'usr-004', userAddress: '0xAbC123De...012345', poolName: 'USDT 稳定池', token: 'USDT', amount: '50000', stakedAt: '2026-05-01 16:45:00', expiresAt: '-', status: 'staking', rewards: '500 USDT' },
  { id: '5', userId: 'usr-005', userAddress: 'TQmKd12x...1f4a5', poolName: 'GXT 质押池', token: 'GXT', amount: '10000', stakedAt: '2026-03-15 11:20:00', expiresAt: '2026-04-15 11:20:00', status: 'unstaked', rewards: '300 GXT' },
  { id: '6', userId: 'usr-006', userAddress: '0x789EfGh...IjKlMn', poolName: 'GXT 质押池', token: 'GXT', amount: '2000', stakedAt: '2026-05-12 08:00:00', expiresAt: '2026-06-12 08:00:00', status: 'staking', rewards: '60 GXT' },
  { id: '7', userId: 'usr-007', userAddress: '0xPqRsTuV...WxYz12', poolName: 'ETH 质押池', token: 'ETH', amount: '10.2', stakedAt: '2026-04-20 13:30:00', expiresAt: '2026-07-20 13:30:00', status: 'staking', rewards: '0.25 ETH' },
  { id: '8', userId: 'usr-008', userAddress: 'bc1abcde...fghijkl', poolName: 'BTC 质押池', token: 'BTC', amount: '1.0', stakedAt: '2026-05-05 10:45:00', expiresAt: '2026-11-05 10:45:00', status: 'staking', rewards: '0.02 BTC' },
  { id: '9', userId: 'usr-009', userAddress: '0x3456789...0abcdef', poolName: 'USDT 稳定池', token: 'USDT', amount: '100000', stakedAt: '2026-04-25 09:20:00', expiresAt: '-', status: 'staking', rewards: '1200 USDT' },
  { id: '10', userId: 'usr-010', userAddress: '0x778899A...aBbCcDd', poolName: 'GXT 质押池', token: 'GXT', amount: '15000', stakedAt: '2026-03-01 14:00:00', expiresAt: '2026-06-01 14:00:00', status: 'staking', rewards: '675 GXT' },
  { id: '11', userId: 'usr-011', userAddress: '0x1122334...5566778', poolName: 'ETH 质押池', token: 'ETH', amount: '3.0', stakedAt: '2026-05-11 16:30:00', expiresAt: '2026-08-11 16:30:00', status: 'pending', rewards: '0 ETH' },
  { id: '12', userId: 'usr-012', userAddress: 'bc1xxyyzz...112233', poolName: 'BTC 质押池', token: 'BTC', amount: '5.0', stakedAt: '2026-02-28 11:15:00', expiresAt: '2026-08-28 11:15:00', status: 'staking', rewards: '0.15 BTC' },
  { id: '13', userId: 'usr-013', userAddress: '0x99AABBc...dEEFF11', poolName: 'USDT 稳定池', token: 'USDT', amount: '25000', stakedAt: '2026-05-08 15:40:00', expiresAt: '-', status: 'staking', rewards: '300 USDT' },
  { id: '14', userId: 'usr-014', userAddress: '0xCCDDeeF...gGHHiiJ', poolName: 'GXT 质押池', token: 'GXT', amount: '8000', stakedAt: '2026-04-10 09:30:00', expiresAt: '2026-05-10 09:30:00', status: 'unstaked', rewards: '240 GXT' },
];

export default function StakingRecordsPage() {
  const [selectedRecord, setSelectedRecord] = useState<StakingRecord | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showDetail = (record: StakingRecord) => {
    setSelectedRecord(record);
    setIsModalVisible(true);
  };

  const columns = [
    { title: '用户ID', dataIndex: 'userId', key: 'userId', render: (text: string) => <span className="font-mono text-sm">{text}</span> },
    { title: '钱包地址', dataIndex: 'userAddress', key: 'userAddress', render: (text: string) => <span className="font-mono text-sm">{text}</span> },
    { title: '矿池', dataIndex: 'poolName', key: 'poolName' },
    { title: '质押代币', dataIndex: 'token', key: 'token', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: '质押数量', dataIndex: 'amount', key: 'amount', render: (text: string, record: StakingRecord) => `${text} ${record.token}` },
    { title: '质押时间', dataIndex: 'stakedAt', key: 'stakedAt' },
    { title: '到期时间', dataIndex: 'expiresAt', key: 'expiresAt', render: (text: string) => text === '-' ? <span className="text-gray-400">灵活</span> : text },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          staking: 'green',
          unstaked: 'gray',
          pending: 'orange'
        };
        const labels: Record<string, string> = {
          staking: '质押中',
          unstaked: '已解除',
          pending: '待处理'
        };
        return <Tag color={colors[status] || 'gray'}>{labels[status] || status}</Tag>;
      }
    },
    { title: '累计收益', dataIndex: 'rewards', key: 'rewards' },
    { 
      title: '操作', 
      key: 'action',
      render: (_: any, record: StakingRecord) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => showDetail(record)}>
          详情
        </Button>
      )
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HistoryOutlined className="text-2xl text-indigo-600" />
            <h1 className="text-2xl font-bold m-0">质押记录</h1>
          </div>
        </div>

        <Card>
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={12} md={6}>
              <Input 
                placeholder="搜索用户ID或地址" 
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select placeholder="筛选矿池" style={{ width: '100%' }}>
                <Option value="all">全部</Option>
                <Option value="GXT 质押池">GXT 质押池</Option>
                <Option value="ETH 质押池">ETH 质押池</Option>
                <Option value="BTC 质押池">BTC 质押池</Option>
                <Option value="USDT 稳定池">USDT 稳定池</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select placeholder="筛选状态" style={{ width: '100%' }}>
                <Option value="all">全部</Option>
                <Option value="staking">质押中</Option>
                <Option value="unstaked">已解除</Option>
                <Option value="pending">待处理</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <RangePicker style={{ width: '100%' }} />
            </Col>
          </Row>

          <Table
            dataSource={mockRecords}
            columns={columns}
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条记录` }}
            rowKey="id"
          />
        </Card>

        {selectedRecord && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsModalVisible(false)}>
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">质押详情</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 font-semibold">记录ID:</div>
                  <div className="col-span-2 font-mono text-sm">{selectedRecord.id}</div>
                  <div className="col-span-1 font-semibold">用户ID:</div>
                  <div className="col-span-2 font-mono text-sm">{selectedRecord.userId}</div>
                  <div className="col-span-1 font-semibold">钱包地址:</div>
                  <div className="col-span-2 font-mono text-sm">{selectedRecord.userAddress}</div>
                  <div className="col-span-1 font-semibold">矿池名称:</div>
                  <div className="col-span-2">{selectedRecord.poolName}</div>
                  <div className="col-span-1 font-semibold">质押代币:</div>
                  <div className="col-span-2">{selectedRecord.token}</div>
                  <div className="col-span-1 font-semibold">质押数量:</div>
                  <div className="col-span-2">{selectedRecord.amount} {selectedRecord.token}</div>
                  <div className="col-span-1 font-semibold">质押时间:</div>
                  <div className="col-span-2">{selectedRecord.stakedAt}</div>
                  <div className="col-span-1 font-semibold">到期时间:</div>
                  <div className="col-span-2">{selectedRecord.expiresAt}</div>
                  <div className="col-span-1 font-semibold">状态:</div>
                  <div className="col-span-2">{selectedRecord.status === 'staking' ? '质押中' : selectedRecord.status === 'unstaked' ? '已解除' : '待处理'}</div>
                  <div className="col-span-1 font-semibold">累计收益:</div>
                  <div className="col-span-2">{selectedRecord.rewards}</div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => setIsModalVisible(false)}>关闭</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}