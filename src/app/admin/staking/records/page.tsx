'use client';

import React, { useState, useEffect } from 'react';
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

export default function StakingRecordsPage() {
  const [records, setRecords] = useState<StakingRecord[]>([]);
  const [loadingRecords, setLoadingRecords] = useState(true);
  const [selectedRecord, setSelectedRecord] = useState<StakingRecord | null>(null);

  useEffect(() => {
    fetch('/api/admin/staking/records?pageSize=100').then(r => r.json()).then(d => {
      if (d.data?.items) setRecords(d.data.items);
      setLoadingRecords(false);
    }).catch(() => setLoadingRecords(false));
  }, []);
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
            dataSource={records}
            loading={loadingRecords}
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