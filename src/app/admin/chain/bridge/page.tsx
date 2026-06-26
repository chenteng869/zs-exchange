'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Statistic, Badge, Progress, Tabs, Switch } from 'antd';
import { TrophyOutlined, PlusOutlined, EyeOutlined, EditOutlined, ArrowRightOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockBridgeTransactions = [
  { id: '1', fromChain: 'Ethereum', toChain: 'Polygon', fromToken: 'ETH', toToken: 'ETH', amount: '1.5', txHash: '0x1a2b...3c4d', status: 'completed', time: '2024-05-13 14:32:15', explorer: '查看' },
  { id: '2', fromChain: 'Polygon', toChain: 'Ethereum', fromToken: 'USDT', toToken: 'USDT', amount: '1000', txHash: '0x5e6f...7a8b', status: 'processing', time: '2024-05-13 14:30:00', explorer: '查看' },
  { id: '3', fromChain: 'BSC', toChain: 'Ethereum', fromToken: 'BNB', toToken: 'BNB', amount: '5.2', txHash: '0x9c0d...1e2f', status: 'completed', time: '2024-05-13 14:25:30', explorer: '查看' },
  { id: '4', fromChain: 'Ethereum', toChain: 'BSC', fromToken: 'USDC', toToken: 'USDC', amount: '500', txHash: '0x3f4a...5b6c', status: 'failed', time: '2024-05-13 14:20:00', explorer: '查看' },
  { id: '5', fromChain: 'Polygon', toChain: 'BSC', fromToken: 'MATIC', toToken: 'MATIC', amount: '10000', txHash: '0x7d8e...9f0a', status: 'completed', time: '2024-05-13 14:15:00', explorer: '查看' },
];

const mockBridgeChains = [
  { id: '1', name: 'Ethereum', chainId: 1, status: 'active', tvl: 15000000, dailyVolume: 2500000, bridgeFee: 0.001, enabled: true },
  { id: '2', name: 'Polygon', chainId: 137, status: 'active', tvl: 8500000, dailyVolume: 1800000, bridgeFee: 0.0005, enabled: true },
  { id: '3', name: 'BSC', chainId: 56, status: 'active', tvl: 6200000, dailyVolume: 1200000, bridgeFee: 0.0008, enabled: true },
  { id: '4', name: 'Arbitrum', chainId: 42161, status: 'maintenance', tvl: 3500000, dailyVolume: 800000, bridgeFee: 0.0003, enabled: false },
];

const bridgeVolumeOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value', name: '金额(USD)' },
  series: [
    { type: 'bar', data: [250, 320, 280, 410, 350, 480, 420], itemStyle: { color: '#1677FF' }, name: '跨链金额(万$)' },
  ],
};

export default function ChainBridgePage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedChain, setSelectedChain] = useState<any>(null);
  const [form] = Form.useForm();

  const txColumns = [
    { 
      title: '来源链', 
      dataIndex: 'fromChain', 
      key: 'fromChain', 
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    { 
      title: '', 
      key: 'arrow', 
      render: () => <ArrowRightOutlined className="text-gray-400" />,
    },
    { 
      title: '目标链', 
      dataIndex: 'toChain', 
      key: 'toChain', 
      render: (text: string) => <Tag color="green">{text}</Tag>,
    },
    { title: '代币', dataIndex: 'fromToken', key: 'fromToken' },
    { title: '金额', dataIndex: 'amount', key: 'amount', render: (val: string) => <span className="font-semibold">{val}</span> },
    { 
      title: '交易哈希', 
      dataIndex: 'txHash', 
      key: 'txHash', 
      render: (val: string) => <code className="text-sm">{val}</code>,
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const statusConfig: Record<string, { color: 'success' | 'processing' | 'error' | 'default'; label: string }> = {
          completed: { color: 'success', label: '已完成' },
          processing: { color: 'processing', label: '处理中' },
          failed: { color: 'error', label: '失败' },
          pending: { color: 'default', label: '待确认' },
        };
        const config = statusConfig[status];
        return <Badge status={config?.color} text={config?.label} />;
      },
    },
    { title: '时间', dataIndex: 'time', key: 'time' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Button type="link" size="small" icon={<EyeOutlined />}>{record.explorer}</Button>
      ),
    },
  ];

  const chainColumns = [
    { title: '链名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-blue-600">{text}</span> },
    { title: '链ID', dataIndex: 'chainId', key: 'chainId' },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const colors: Record<string, 'success' | 'warning'> = { active: 'success', maintenance: 'warning' };
        const labels: Record<string, string> = { active: '运行中', maintenance: '维护中' };
        return <Badge status={colors[status]} text={labels[status]} />;
      },
    },
    { title: 'TVL', dataIndex: 'tvl', key: 'tvl', render: (val: number) => `$${(val / 1000000).toFixed(2)}M` },
    { title: '24h交易量', dataIndex: 'dailyVolume', key: 'dailyVolume', render: (val: number) => `$${(val / 1000000).toFixed(2)}M` },
    { title: '桥接费', dataIndex: 'bridgeFee', key: 'bridgeFee', render: (val: number) => `${(val * 100).toFixed(2)}%` },
    { 
      title: '启用状态', 
      dataIndex: 'enabled', 
      key: 'enabled', 
      render: (val: boolean) => <Switch checked={val} disabled />,
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEditChain(record)}>配置</Button>
        </Space>
      ),
    },
  ];

  const handleEditChain = (record: any) => {
    setSelectedChain(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const totalVolume = 5500000;
  const activeChains = mockBridgeChains.filter(c => c.status === 'active').length;
  const totalChains = mockBridgeChains.length;
  const totalTransactions = mockBridgeTransactions.length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrophyOutlined className="text-2xl text-cyan-600" />
            <h1 className="text-2xl font-bold m-0">跨链桥</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />}>添加链</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="24h跨链量" value={(totalVolume / 1000000).toFixed(2)} suffix="M USD" valueStyle={{ color: '#1677FF' }} />
              <div className="text-green-500 text-sm mt-1">+12.5% (24h)</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="支持链数" value={`${activeChains}/${totalChains}`} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">活跃链数/总链数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="今日交易" value={totalTransactions} valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">跨链交易笔数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="成功率" value={98.5} suffix="%" valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">跨链交易成功</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="跨链交易量趋势">
              <SafeECharts option={bridgeVolumeOption} style={{ height: 250 }} title="跨链交易量趋势" />
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="transactions" items={[
          { 
            key: 'transactions', 
            label: '跨链记录',
            children: (
              <Card title="跨链交易记录">
                <Table
                  dataSource={mockBridgeTransactions}
                  columns={txColumns}
                  pagination={{ pageSize: 10 }}
                  rowKey="id"
                />
              </Card>
            )
          },
          { 
            key: 'chains', 
            label: '链配置',
            children: (
              <Card title="链配置管理">
                <Table
                  dataSource={mockBridgeChains}
                  columns={chainColumns}
                  pagination={{ pageSize: 10 }}
                  rowKey="id"
                />
              </Card>
            )
          },
        ]} />

        <Modal
          title={selectedChain ? `${selectedChain.name} 配置` : '添加新链'}
          open={isModalVisible}
          onOk={() => {
            form.validateFields().then(() => {
              Modal.success({ title: '配置更新成功', content: '链配置已更新！' });
              setIsModalVisible(false);
              setSelectedChain(null);
            });
          }}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedChain(null);
          }}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="链名称" name="name" rules={[{ required: true, message: '请输入链名称' }]}>
              <Input placeholder="例如：Ethereum" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="链ID" name="chainId" rules={[{ required: true, message: '请输入链ID' }]}>
                  <InputNumber min={1} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="桥接费 (%)" name="bridgeFee" rules={[{ required: true, message: '请输入桥接费' }]}>
                  <InputNumber min={0} max={10} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="RPC地址" name="rpcUrl">
              <Input placeholder="https://rpc.example.com" />
            </Form.Item>
            <Form.Item label="启用状态" name="enabled" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}