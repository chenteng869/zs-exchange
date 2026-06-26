'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Badge, Statistic, Descriptions } from 'antd';
import { EyeOutlined, PlusOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockDistributions = [
  { id: '1', projectName: 'GXT Protocol', symbol: 'GXT', walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f6E391', amount: 10000, status: 'success', txHash: '0xabc123...', blockNumber: '18523400', createdAt: '2024-06-01 10:00:00' },
  { id: '2', projectName: 'GXT Protocol', symbol: 'GXT', walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC', amount: 5000, status: 'success', txHash: '0xdef456...', blockNumber: '18523450', createdAt: '2024-06-01 10:15:00' },
  { id: '3', projectName: 'Web3 Gaming', symbol: 'WGX', walletAddress: '0x90F79bf6EB2c4f870365E785982E1f101E93b906', amount: 8000, status: 'processing', txHash: '-', blockNumber: '-', createdAt: '2024-06-01 14:00:00' },
  { id: '4', projectName: 'DeFi Gateway', symbol: 'DFG', walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65', amount: 12000, status: 'success', txHash: '0xghi789...', blockNumber: '18450000', createdAt: '2024-04-15 09:00:00' },
  { id: '5', projectName: 'NFT Market', symbol: 'NFM', walletAddress: '0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc', amount: 3000, status: 'failed', txHash: '0xjkl012...', blockNumber: '-', createdAt: '2024-05-03 16:30:00' },
];

const distributionColumns = [
  { title: '项目名称', dataIndex: 'projectName', key: 'projectName', render: (text: string, record: any) => (
    <span className="font-semibold text-blue-600">{text} <Tag color="cyan">{record.symbol}</Tag></span>
  ) },
  { title: '接收地址', dataIndex: 'walletAddress', key: 'walletAddress', render: (text: string) => <code className="text-sm text-gray-600">{text}</code> },
  { title: '发放数量', dataIndex: 'amount', key: 'amount', render: (val: number) => <span className="text-green-600 font-semibold">{val.toLocaleString()}</span> },
  { 
    title: '状态', 
    dataIndex: 'status', 
    key: 'status', 
    render: (status: string) => {
      const config: Record<string, { color: 'success' | 'processing' | 'error'; label: string }> = {
        success: { color: 'success', label: '已发放' },
        processing: { color: 'processing', label: '发放中' },
        failed: { color: 'error', label: '发放失败' },
      };
      const c = config[status];
      return <Badge status={c?.color} text={c?.label} />;
    },
  },
  { title: '交易哈希', dataIndex: 'txHash', key: 'txHash', render: (text: string) => text !== '-' ? <code className="text-xs text-blue-600">{text}</code> : '-' },
  { title: '区块高度', dataIndex: 'blockNumber', key: 'blockNumber' },
  { title: '发放时间', dataIndex: 'createdAt', key: 'createdAt' },
  { 
    title: '操作', 
    key: 'action', 
    render: (_: any, record: any) => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
        {record.status === 'failed' && (
          <Button type="link" size="small">重试</Button>
        )}
      </Space>
    ),
  },
];

const distributionChartOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['GXT', 'DFG', 'WGX', 'NFM'] },
  yAxis: { type: 'value', name: '发放数量(万)' },
  series: [
    { type: 'bar', data: [150, 120, 8, 3], itemStyle: { color: '#16A34A' }, name: '已发放' },
    { type: 'bar', data: [0, 0, 0, 3], itemStyle: { color: '#DC2626' }, name: '失败' },
  ],
};

const mockProjects = [
  { id: '1', name: 'GXT Protocol', symbol: 'GXT' },
  { id: '2', name: 'Web3 Gaming', symbol: 'WGX' },
  { id: '3', name: 'DeFi Gateway', symbol: 'DFG' },
  { id: '4', name: 'NFT Market', symbol: 'NFM' },
];

export default function IDODistributionPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedDistribution, setSelectedDistribution] = useState<any>(null);
  const [form] = Form.useForm();

  const totalDistributions = mockDistributions.length;
  const successCount = mockDistributions.filter(d => d.status === 'success').length;
  const failedCount = mockDistributions.filter(d => d.status === 'failed').length;
  const totalAmount = mockDistributions.reduce((sum, d) => sum + d.amount, 0);

  const handleViewDetail = (record: any) => {
    setSelectedDistribution(record);
    setIsModalVisible(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircleOutlined className="text-2xl text-yellow-600" />
            <h1 className="text-2xl font-bold m-0">代币发放</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />}>批量发放</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="发放总数" value={totalDistributions} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">累计发放笔数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="发放成功" value={successCount} suffix={`/${totalDistributions}`} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">成功比例</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="发放失败" value={failedCount} valueStyle={{ color: '#DC2626' }} />
              <div className="text-gray-400 text-sm mt-1">失败笔数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="发放总量" value={totalAmount.toLocaleString()} suffix=" 代币" valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">累计发放代币</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="发放统计">
              <SafeECharts option={distributionChartOption} style={{ height: 250 }} title="发放统计" />
            </Card>
          </Col>
        </Row>

        <Card title="发放记录">
          <div className="mb-4">
            <Select placeholder="选择项目" style={{ width: 200, marginRight: 16 }}>
              <Option value="all">全部项目</Option>
              {mockProjects.map(p => (
                <Option key={p.id} value={p.id}>{p.name} ({p.symbol})</Option>
              ))}
            </Select>
            <Select placeholder="选择状态" style={{ width: 150, marginRight: 16 }}>
              <Option value="all">全部状态</Option>
              <Option value="success">已发放</Option>
              <Option value="processing">发放中</Option>
              <Option value="failed">发放失败</Option>
            </Select>
            <Input placeholder="搜索钱包地址" style={{ width: 250 }} />
          </div>
          <Table
            dataSource={mockDistributions}
            columns={distributionColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title="发放详情"
          open={isModalVisible}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedDistribution(null);
          }}
          width={500}
        >
          {selectedDistribution && (
            <Descriptions bordered column={2}>
              <Descriptions.Item label="项目名称" span={2}>
                {selectedDistribution.projectName} <Tag color="cyan">{selectedDistribution.symbol}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="接收地址">
                <code className="text-sm">{selectedDistribution.walletAddress}</code>
              </Descriptions.Item>
              <Descriptions.Item label="发放数量">
                <span className="text-green-600 font-semibold">{selectedDistribution.amount.toLocaleString()} {selectedDistribution.symbol}</span>
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {(() => {
                  const config: Record<string, { color: 'success' | 'processing' | 'error'; label: string }> = {
                    success: { color: 'success', label: '已发放' },
                    processing: { color: 'processing', label: '发放中' },
                    failed: { color: 'error', label: '发放失败' },
                  };
                  const c = config[selectedDistribution.status];
                  return <Badge status={c?.color} text={c?.label} />;
                })()}
              </Descriptions.Item>
              <Descriptions.Item label="交易哈希" span={2}>
                {selectedDistribution.txHash !== '-' ? (
                  <code className="text-xs text-blue-600">{selectedDistribution.txHash}</code>
                ) : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="区块高度">{selectedDistribution.blockNumber}</Descriptions.Item>
              <Descriptions.Item label="发放时间" span={2}>{selectedDistribution.createdAt}</Descriptions.Item>
            </Descriptions>
          )}
        </Modal>

        <Modal
          title="批量发放代币"
          open={false}
          onCancel={() => {}}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="选择项目" name="projectId" rules={[{ required: true, message: '请选择项目' }]}>
              <Select placeholder="请选择项目">
                {mockProjects.map(p => (
                  <Option key={p.id} value={p.id}>{p.name} ({p.symbol})</Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label="发放地址列表">
              <Input.TextArea rows={4} placeholder="每行一个钱包地址..." />
            </Form.Item>
            <Form.Item label="发放数量" name="amount" rules={[{ required: true, message: '请输入发放数量' }]}>
              <Input placeholder="每个地址发放的代币数量" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}