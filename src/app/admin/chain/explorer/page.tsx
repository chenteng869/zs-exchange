'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Input, Select, Statistic, Badge, Modal, Tabs } from 'antd';
import { SearchOutlined, ArrowRightOutlined, EyeOutlined, ClockCircleOutlined, TrophyOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockBlocks = [
  { hash: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', height: 18542300, timestamp: '2024-05-13 14:32:15', transactions: 156, gasUsed: '2,458,320', gasLimit: '30,000,000', proposer: '0x7a8b...9c0d', confirmations: 12 },
  { hash: '0x2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c', height: 18542299, timestamp: '2024-05-13 14:32:10', transactions: 89, gasUsed: '1,823,450', gasLimit: '30,000,000', proposer: '0x8b9c...0d1e', confirmations: 13 },
  { hash: '0x3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d', height: 18542298, timestamp: '2024-05-13 14:32:05', transactions: 234, gasUsed: '4,123,890', gasLimit: '30,000,000', proposer: '0x9c0d...1e2f', confirmations: 14 },
  { hash: '0x4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e', height: 18542297, timestamp: '2024-05-13 14:32:00', transactions: 67, gasUsed: '1,234,560', gasLimit: '30,000,000', proposer: '0x0d1e...2f3a', confirmations: 15 },
  { hash: '0x5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f', height: 18542296, timestamp: '2024-05-13 14:31:55', transactions: 198, gasUsed: '3,567,890', gasLimit: '30,000,000', proposer: '0x1e2f...3a4b', confirmations: 16 },
];

const mockTransactions = [
  { hash: '0x7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a', type: 'transfer', from: '0x1234...5678', to: '0x9abc...def0', value: '125.5 USDT', gasUsed: '21,000', status: 'success', timestamp: '2024-05-13 14:32:15' },
  { hash: '0x8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a', type: 'swap', from: '0x5678...1234', to: '0xdef0...9abc', value: '0.5 ETH', gasUsed: '156,000', status: 'success', timestamp: '2024-05-13 14:32:12' },
  { hash: '0x9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b', type: 'stake', from: '0x9abc...1234', to: '0xStaking...Contract', value: '10,000 GXT', gasUsed: '89,000', status: 'success', timestamp: '2024-05-13 14:32:08' },
  { hash: '0xa0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c', type: 'transfer', from: '0xdef0...5678', to: '0x1234...9abc', value: '5.2 ETH', gasUsed: '21,000', status: 'failed', timestamp: '2024-05-13 14:32:05' },
  { hash: '0xb1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d', type: 'mint', from: '0x0000...0000', to: '0x5678...def0', value: '1 NFT', gasUsed: '256,000', status: 'success', timestamp: '2024-05-13 14:32:00' },
];

export default function ChainExplorerPage() {
  const [searchValue, setSearchValue] = useState('');
  const [searchType, setSearchType] = useState('block');
  const [selectedBlock, setSelectedBlock] = useState<any>(null);

  const blockColumns = [
    { 
      title: '区块高度', 
      dataIndex: 'height', 
      key: 'height', 
      render: (val: number) => <span className="font-bold text-blue-600">#{val.toLocaleString()}</span>,
    },
    { 
      title: '区块哈希', 
      dataIndex: 'hash', 
      key: 'hash', 
      render: (val: string) => <code className="text-sm truncate block max-w-xs">{val}</code>,
    },
    { 
      title: '时间', 
      dataIndex: 'timestamp', 
      key: 'timestamp', 
      render: (val: string) => <span className="text-gray-600">{val}</span>,
    },
    { 
      title: '交易数', 
      dataIndex: 'transactions', 
      key: 'transactions', 
      render: (val: number) => <Badge count={val} color="blue" />,
    },
    { 
      title: 'Gas使用', 
      dataIndex: 'gasUsed', 
      key: 'gasUsed', 
      render: (val: string, record: any) => {
        const used = parseInt(val.replace(/,/g, ''));
        const limit = parseInt(record.gasLimit.replace(/,/g, ''));
        const percent = Math.round((used / limit) * 100);
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm">{val}</span>
            <span className="text-xs text-gray-400">({percent}%)</span>
          </div>
        );
      },
    },
    { 
      title: '确认数', 
      dataIndex: 'confirmations', 
      key: 'confirmations', 
      render: (val: number) => <span className={val >= 12 ? 'text-green-600' : 'text-yellow-600'}>{val}</span>,
    },
    { 
      title: '提议者', 
      dataIndex: 'proposer', 
      key: 'proposer', 
      render: (val: string) => <code className="text-sm">{val}</code>,
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => setSelectedBlock(record)}>查看详情</Button>
      ),
    },
  ];

  const transactionColumns = [
    { 
      title: '交易哈希', 
      dataIndex: 'hash', 
      key: 'hash', 
      render: (val: string) => <code className="text-sm truncate block max-w-sm">{val}</code>,
    },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type', 
      render: (type: string) => {
        const types = { transfer: '转账', swap: '兑换', stake: '质押', mint: '铸造', burn: '销毁' };
        const colors = { transfer: 'blue', swap: 'green', stake: 'purple', mint: 'orange', burn: 'red' };
        return <Tag color={colors[type as keyof typeof colors]}>{types[type as keyof typeof types]}</Tag>;
      },
    },
    { 
      title: '发送方', 
      dataIndex: 'from', 
      key: 'from', 
      render: (val: string) => <code className="text-sm">{val}</code>,
    },
    { 
      title: '', 
      key: 'arrow', 
      render: () => <ArrowRightOutlined className="text-gray-400" />,
    },
    { 
      title: '接收方', 
      dataIndex: 'to', 
      key: 'to', 
      render: (val: string) => <code className="text-sm">{val}</code>,
    },
    { 
      title: '金额', 
      dataIndex: 'value', 
      key: 'value', 
      render: (val: string) => <span className="font-semibold text-green-600">{val}</span>,
    },
    { 
      title: 'Gas', 
      dataIndex: 'gasUsed', 
      key: 'gasUsed', 
      render: (val: string) => `${val}`,
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const colors: Record<string, 'success' | 'error'> = { success: 'success', failed: 'error' };
        const labels: Record<string, string> = { success: '成功', failed: '失败' };
        return <Badge status={colors[status]} text={labels[status]} />;
      },
    },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp' },
  ];

  const handleSearch = () => {
    Modal.info({
      title: '搜索结果',
      content: `正在搜索 ${searchType === 'block' ? '区块' : searchType === 'transaction' ? '交易' : '地址'}: ${searchValue}`,
    });
  };

  const totalBlocks = 18542300;
  const totalTransactions = 125847932;
  const avgBlockTime = 5;
  const activeValidators = 150;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrophyOutlined className="text-2xl text-green-600" />
            <h1 className="text-2xl font-bold m-0">区块浏览器</h1>
          </div>
        </div>

        <Card className="bg-gradient-to-r from-green-50 to-blue-50">
          <div className="flex flex-wrap gap-4 items-center">
            <Select
              value={searchType}
              onChange={setSearchType}
              style={{ width: 150 }}
              placeholder="搜索类型"
            >
              <Option value="block">区块高度/哈希</Option>
              <Option value="transaction">交易哈希</Option>
              <Option value="address">钱包地址</Option>
            </Select>
            <Input
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={`请输入${searchType === 'block' ? '区块高度或哈希' : searchType === 'transaction' ? '交易哈希' : '钱包地址'}`}
              style={{ width: 400 }}
              prefix={<SearchOutlined />}
              onPressEnter={handleSearch}
            />
            <Button type="primary" onClick={handleSearch}>搜索</Button>
          </div>
        </Card>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="最新区块" value={totalBlocks} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">区块高度</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总交易量" value={totalTransactions.toLocaleString()} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">累计交易笔数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="出块间隔" value={avgBlockTime} suffix="秒" valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">平均出块时间</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="验证节点" value={activeValidators} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">活跃验证者数量</div>
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="blocks" items={[
          { 
            key: 'blocks', 
            label: '最新区块',
            children: (
              <Card bodyStyle={{ padding: 0 }}>
                <Table
                  dataSource={mockBlocks}
                  columns={blockColumns}
                  pagination={{ pageSize: 10 }}
                  rowKey="hash"
                />
              </Card>
            )
          },
          { 
            key: 'transactions', 
            label: '最新交易',
            children: (
              <Card bodyStyle={{ padding: 0 }}>
                <Table
                  dataSource={mockTransactions}
                  columns={transactionColumns}
                  pagination={{ pageSize: 10 }}
                  rowKey="hash"
                />
              </Card>
            )
          },
        ]} />

        <Modal
          title={`区块 #${selectedBlock?.height}`}
          open={!!selectedBlock}
          onCancel={() => setSelectedBlock(null)}
          width={800}
        >
          {selectedBlock && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-500 text-sm">区块哈希</label>
                  <p className="font-mono text-sm break-all">{selectedBlock.hash}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">区块高度</label>
                  <p className="font-bold text-blue-600">#{selectedBlock.height.toLocaleString()}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">时间戳</label>
                  <p>{selectedBlock.timestamp}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">提议者</label>
                  <p className="font-mono text-sm">{selectedBlock.proposer}</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">交易数量</label>
                  <p className="font-bold">{selectedBlock.transactions} 笔</p>
                </div>
                <div>
                  <label className="text-gray-500 text-sm">确认数</label>
                  <p className={selectedBlock.confirmations >= 12 ? 'text-green-600' : 'text-yellow-600'}>{selectedBlock.confirmations}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <label className="text-gray-500 text-sm">Gas使用</label>
                <div className="flex items-center gap-4 mt-2">
                  <span>已使用: {selectedBlock.gasUsed}</span>
                  <span className="text-gray-400">/</span>
                  <span>上限: {selectedBlock.gasLimit}</span>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}