'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Badge, Statistic, Descriptions } from 'antd';
import { ShoppingCartOutlined, EyeOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockSubscriptions = [
  { id: '1', projectName: 'GXT Protocol', symbol: 'GXT', walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f6E391', username: 'whale_001', amount: 10000, usdAmount: 500, status: 'success', txHash: '0xabc123...', createdAt: '2024-06-01 10:30:00' },
  { id: '2', projectName: 'GXT Protocol', symbol: 'GXT', walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', username: 'vip_user', amount: 5000, usdAmount: 250, status: 'success', txHash: '0xdef456...', createdAt: '2024-06-01 11:15:00' },
  { id: '3', projectName: 'GXT Protocol', symbol: 'GXT', walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', username: 'investor_2024', amount: 2000, usdAmount: 100, status: 'pending', txHash: '-', createdAt: '2024-06-01 14:20:00' },
  { id: '4', projectName: 'Web3 Gaming', symbol: 'WGX', walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', username: 'web3_pro', amount: 8000, usdAmount: 240, status: 'success', txHash: '0xghi789...', createdAt: '2024-05-22 09:45:00' },
  { id: '5', projectName: 'NFT Market', symbol: 'NFM', walletAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', username: 'nft_collector', amount: 3000, usdAmount: 180, status: 'failed', txHash: '0xjkl012...', createdAt: '2024-05-03 16:00:00' },
];

const subscriptionColumns = [
  { title: '项目名称', dataIndex: 'projectName', key: 'projectName', render: (text: string, record: any) => (
    <span className="font-semibold text-blue-600">{text} <Tag color="cyan">{record.symbol}</Tag></span>
  ) },
  { title: '钱包地址', dataIndex: 'walletAddress', key: 'walletAddress', render: (text: string) => <code className="text-sm text-gray-600">{text}</code> },
  { title: '用户名', dataIndex: 'username', key: 'username' },
  { title: '申购数量', dataIndex: 'amount', key: 'amount', render: (val: number, record: any) => `${val.toLocaleString()} ${record.symbol}` },
  { title: '申购金额', dataIndex: 'usdAmount', key: 'usdAmount', render: (val: number) => <span className="text-green-600 font-semibold">${val}</span> },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status', 
    render: (status: string) => {
      const config: Record<string, { color: 'success' | 'processing' | 'error'; label: string }> = {
        success: { color: 'success', label: '成功' },
        pending: { color: 'processing', label: '处理中' },
        failed: { color: 'error', label: '失败' },
      };
      const c = config[status];
      return <Badge status={c?.color} text={c?.label} />;
    },
  },
  { title: '交易哈希', dataIndex: 'txHash', key: 'txHash', render: (text: string) => text !== '-' ? <code className="text-xs text-blue-600">{text}</code> : '-' },
  { title: '申购时间', dataIndex: 'createdAt', key: 'createdAt' },
  { 
    title: '操作', 
    key: 'action', 
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
      </Space>
    ),
  },
];

const mockProjects = [
  { id: '1', name: 'GXT Protocol', symbol: 'GXT' },
  { id: '2', name: 'Web3 Gaming', symbol: 'WGX' },
  { id: '3', name: 'NFT Market', symbol: 'NFM' },
];

export default function IDOSubscriptionsPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);

  const totalSubscriptions = mockSubscriptions.length;
  const successCount = mockSubscriptions.filter(s => s.status === 'success').length;
  const pendingCount = mockSubscriptions.filter(s => s.status === 'pending').length;
  const totalUsdAmount = mockSubscriptions.reduce((sum, s) => sum + s.usdAmount, 0);

  const handleViewDetail = (record: any) => {
    setSelectedSubscription(record);
    setIsModalVisible(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCartOutlined className="text-2xl text-green-600" />
            <h1 className="text-2xl font-bold m-0">申购管理</h1>
          </div>
          <Button>导出记录</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="申购总数" value={totalSubscriptions} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">累计申购笔数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="成功申购" value={successCount} suffix={`/${totalSubscriptions}`} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">成功比例</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="处理中" value={pendingCount} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">待处理数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="申购总额" value={totalUsdAmount} prefix="$" valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">累计申购金额</div>
            </Card>
          </Col>
        </Row>

        <Card title="申购列表">
          <div className="mb-4">
            <Select placeholder="选择项目" style={{ width: 200, marginRight: 16 }}>
              <Option value="all">全部项目</Option>
              {mockProjects.map(p => (
                <Option key={p.id} value={p.id}>{p.name} ({p.symbol})</Option>
              ))}
            </Select>
            <Select placeholder="选择状态" style={{ width: 150, marginRight: 16 }}>
              <Option value="all">全部状态</Option>
              <Option value="success">成功</Option>
              <Option value="pending">处理中</Option>
              <Option value="failed">失败</Option>
            </Select>
            <Input placeholder="搜索钱包地址或用户名" style={{ width: 250 }} />
          </div>
          <Table
            dataSource={mockSubscriptions}
            columns={subscriptionColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title="申购详情"
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedSubscription(null);
          }}
          width={500}
        >
          {selectedSubscription && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="项目名称" span={2}>
                {selectedSubscription.projectName} <Tag color="cyan">{selectedSubscription.symbol}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="钱包地址">
                <code className="text-sm">{selectedSubscription.walletAddress}</code>
              </Descriptions.Item>
              <Descriptions.Item label="用户名">{selectedSubscription.username}</Descriptions.Item>
              <Descriptions.Item label="申购数量">{selectedSubscription.amount.toLocaleString()} {selectedSubscription.symbol}</Descriptions.Item>
              <Descriptions.Item label="申购金额">${selectedSubscription.usdAmount}</Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const config: Record<string, { color: 'success' | 'processing' | 'error'; label: string }> = {
                    success: { color: 'success', label: '成功' },
                    pending: { color: 'processing', label: '处理中' },
                    failed: { color: 'error', label: '失败' },
                  };
                  const c = config[selectedSubscription.status];
                  return <Badge status={c?.color} text={c?.label} />;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="交易哈希" span={2}>
                {selectedSubscription.txHash !== '-' ? (
                  <code className="text-xs text-blue-600">{selectedSubscription.txHash}</code>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="申购时间" span={2}>{selectedSubscription.createdAt}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}