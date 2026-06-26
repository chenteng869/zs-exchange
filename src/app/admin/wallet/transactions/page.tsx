'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Form, Input, Select, DatePicker } from 'antd';
import { EyeOutlined, SearchOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { RangePicker } = DatePicker;
const { Option } = Select;

interface Transaction {
  id: string;
  hash: string;
  type: string;
  chain: string;
  from: string;
  to: string;
  amount: string;
  status: string;
  timestamp: string;
  fee: string;
}

const mockTransactions: Transaction[] = [
  { id: '1', hash: '0xabc123def456...', type: 'transfer', chain: 'Ethereum', from: '0x742d35Cc...22A8', to: '0x1a2b3c4d...r9s0t', amount: '5.5 ETH', status: 'success', timestamp: '2026-05-13 14:30:00', fee: '0.005 ETH' },
  { id: '2', hash: '0xdef789ghi012...', type: 'deposit', chain: 'Bitcoin', from: 'bc1qxy2kg...hx0wlh', to: 'Internal', amount: '0.5 BTC', status: 'success', timestamp: '2026-05-13 13:15:00', fee: '0.0001 BTC' },
  { id: '3', hash: '0xjkl345mno678...', type: 'withdraw', chain: 'BSC', from: 'Internal', to: '0xAbC123De...012345', amount: '100 BNB', status: 'pending', timestamp: '2026-05-13 12:00:00', fee: '0.001 BNB' },
  { id: '4', hash: '0xpqr901stu234...', type: 'swap', chain: 'Polygon', from: 'Internal', to: 'Internal', amount: '1000 MATIC → 500 USDT', status: 'success', timestamp: '2026-05-13 10:45:00', fee: '1 MATIC' },
  { id: '5', hash: '0xvwx567yza890...', type: 'transfer', chain: 'TRON', from: 'TQmKd12x...1f4a5', to: 'TRC20 Address', amount: '50000 TRX', status: 'failed', timestamp: '2026-05-13 09:30:00', fee: '0 TRX' },
];

export default function TransactionHistoryPage() {
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const showDetail = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsModalVisible(true);
  };

  const columns = [
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', width: 180 },
    { title: '哈希', dataIndex: 'hash', key: 'hash', render: (text: string) => <span className="font-mono text-sm">{text}</span> },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type',
      render: (type: string) => {
        const colors: Record<string, string> = {
          transfer: 'blue',
          deposit: 'green',
          withdraw: 'orange',
          swap: 'purple'
        };
        const labels: Record<string, string> = {
          transfer: '转账',
          deposit: '充值',
          withdraw: '提现',
          swap: '兑换'
        };
        return <Tag color={colors[type] || 'gray'}>{labels[type] || type}</Tag>;
      }
    },
    { title: '公链', dataIndex: 'chain', key: 'chain' },
    { title: '数量', dataIndex: 'amount', key: 'amount' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        const colors: Record<string, string> = {
          success: 'green',
          pending: 'orange',
          failed: 'red'
        };
        const labels: Record<string, string> = {
          success: '成功',
          pending: '处理中',
          failed: '失败'
        };
        return <Tag color={colors[status] || 'gray'}>{labels[status] || status}</Tag>;
      }
    },
    { 
      title: '操作', 
      key: 'action',
      render: (_: any, record: Transaction) => (
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
          <h1 className="text-2xl font-bold m-0">交易记录</h1>
        </div>

        <Card>
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={12} md={6}>
              <Input 
                placeholder="搜索哈希或地址" 
                prefix={<SearchOutlined />}
              />
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select placeholder="筛选类型" style={{ width: '100%' }}>
                <Option value="all">全部</Option>
                <Option value="transfer">转账</Option>
                <Option value="deposit">充值</Option>
                <Option value="withdraw">提现</Option>
                <Option value="swap">兑换</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select placeholder="筛选状态" style={{ width: '100%' }}>
                <Option value="all">全部</Option>
                <Option value="success">成功</Option>
                <Option value="pending">处理中</Option>
                <Option value="failed">失败</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={4}>
              <Select placeholder="筛选公链" style={{ width: '100%' }}>
                <Option value="all">全部</Option>
                <Option value="Ethereum">Ethereum</Option>
                <Option value="Bitcoin">Bitcoin</Option>
                <Option value="BSC">BSC</Option>
                <Option value="Polygon">Polygon</Option>
                <Option value="TRON">TRON</Option>
              </Select>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <RangePicker style={{ width: '100%' }} />
            </Col>
          </Row>

          <Table
            dataSource={mockTransactions}
            columns={columns}
            pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条交易` }}
            rowKey="id"
          />
        </Card>

        {/* 详情弹窗 */}
        {selectedTx && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setIsModalVisible(false)}>
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4" onClick={(e) => e.stopPropagation()}>
              <h2 className="text-xl font-bold mb-4">交易详情</h2>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-1 font-semibold">哈希:</div>
                  <div className="col-span-2 font-mono text-sm break-all">{selectedTx.hash}</div>
                  <div className="col-span-1 font-semibold">类型:</div>
                  <div className="col-span-2">{selectedTx.type}</div>
                  <div className="col-span-1 font-semibold">公链:</div>
                  <div className="col-span-2">{selectedTx.chain}</div>
                  <div className="col-span-1 font-semibold">发送方:</div>
                  <div className="col-span-2 font-mono text-sm">{selectedTx.from}</div>
                  <div className="col-span-1 font-semibold">接收方:</div>
                  <div className="col-span-2 font-mono text-sm">{selectedTx.to}</div>
                  <div className="col-span-1 font-semibold">数量:</div>
                  <div className="col-span-2">{selectedTx.amount}</div>
                  <div className="col-span-1 font-semibold">手续费:</div>
                  <div className="col-span-2">{selectedTx.fee}</div>
                  <div className="col-span-1 font-semibold">状态:</div>
                  <div className="col-span-2">{selectedTx.status}</div>
                  <div className="col-span-1 font-semibold">时间:</div>
                  <div className="col-span-2">{selectedTx.timestamp}</div>
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