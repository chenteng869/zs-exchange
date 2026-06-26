'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Badge, Statistic, InputNumber } from 'antd';
import { ContainerOutlined, PlusOutlined, EyeOutlined, EditOutlined, TransactionOutlined, UserOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockNFTs = [
  { id: '1', name: '孔子画像NFT', type: '非遗内容', status: 'minted', price: 0.5, owner: '0x7a2d...3f4e', mintTime: '2024-05-01 10:00:00', transactions: 5 },
  { id: '2', name: '唐诗三百首NFT', type: '国学动漫', status: 'minted', price: 0.3, owner: '0x8b3f...5g6h', mintTime: '2024-05-05 14:30:00', transactions: 3 },
  { id: '3', name: '苏绣珍品NFT', type: '非遗内容', status: 'minting', price: 0.8, owner: '-', mintTime: '-', transactions: 0 },
  { id: '4', name: '红楼梦短剧NFT', type: '真人短剧', status: 'minted', price: 0.6, owner: '0x9c4g...7h8i', mintTime: '2024-05-10 09:15:00', transactions: 8 },
  { id: '5', name: '景德镇瓷器NFT', type: '非遗内容', status: 'draft', price: 0, owner: '-', mintTime: '-', transactions: 0 },
];

const mockTransactions = [
  { id: '1', nftName: '孔子画像NFT', from: '0x1a2b...3c4d', to: '0x7a2d...3f4e', price: 0.5, time: '2024-05-12 16:45:00', type: 'transfer' },
  { id: '2', nftName: '唐诗三百首NFT', from: '0x5e6f...7g8h', to: '0x8b3f...5g6h', price: 0.3, time: '2024-05-11 11:20:00', type: 'mint' },
  { id: '3', nftName: '红楼梦短剧NFT', from: '0x9i0j...1k2l', to: '0x9c4g...7h8i', price: 0.6, time: '2024-05-10 15:30:00', type: 'sale' },
];

const nftChartOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['铸造数量', '交易量'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['国学动漫', '真人短剧', '非遗内容'] },
  yAxis: { type: 'value', name: '数量' },
  series: [
    { type: 'bar', data: [15, 12, 20], itemStyle: { color: '#7C3AED' }, name: '铸造数量' },
    { type: 'bar', data: [45, 38, 52], itemStyle: { color: '#1677FF' }, name: '交易量' },
  ],
};

export default function ContentNFTPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<any>(null);
  const [form] = Form.useForm();

  const nftColumns = [
    { title: 'NFT名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-purple-600">{text}</span> },
    { 
      title: '内容类型', 
      dataIndex: 'type', 
      key: 'type', 
      render: (type: string) => {
        const colors = { '国学动漫': 'blue', '真人短剧': 'green', '非遗内容': 'orange' };
        return <Tag color={colors[type as keyof typeof colors]}>{type}</Tag>;
      },
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const config: Record<string, { color: 'success' | 'warning' | 'default' | 'processing'; label: string }> = {
          minted: { color: 'success', label: '已铸造' },
          minting: { color: 'processing', label: '铸造中' },
          draft: { color: 'default', label: '草稿' },
        };
        const c = config[status];
        return <Badge status={c?.color} text={c?.label} />;
      },
    },
    { title: '价格(ETH)', dataIndex: 'price', key: 'price', render: (val: number) => val > 0 ? val : '-' },
    { title: '当前拥有者', dataIndex: 'owner', key: 'owner' },
    { title: '铸造时间', dataIndex: 'mintTime', key: 'mintTime' },
    { title: '交易次数', dataIndex: 'transactions', key: 'transactions' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleView(record)}>详情</Button>
          {record.status === 'draft' && (
            <Button type="link" size="small" icon={<ContainerOutlined />} onClick={() => handleMint(record)}>铸造</Button>
          )}
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
        </Space>
      ),
    },
  ];

  const transactionColumns = [
    { title: 'NFT名称', dataIndex: 'nftName', key: 'nftName', render: (text: string) => <span className="font-semibold text-blue-600">{text}</span> },
    { title: '发送者', dataIndex: 'from', key: 'from' },
    { title: '接收者', dataIndex: 'to', key: 'to' },
    { title: '价格(ETH)', dataIndex: 'price', key: 'price' },
    { 
      title: '交易类型', 
      dataIndex: 'type', 
      key: 'type', 
      render: (type: string) => {
        const colors = { 'mint': 'blue', 'transfer': 'green', 'sale': 'purple' };
        const labels = { 'mint': '铸造', 'transfer': '转账', 'sale': '出售' };
        return <Tag color={colors[type as keyof typeof colors]}>{labels[type as keyof typeof labels]}</Tag>;
      },
    },
    { title: '交易时间', dataIndex: 'time', key: 'time' },
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

  const handleView = (record: any) => {
    setSelectedNFT(record);
    setIsModalVisible(true);
  };

  const handleMint = (record: any) => {
    setSelectedNFT(record);
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setSelectedNFT(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const totalNFTs = mockNFTs.length;
  const mintedNFTs = mockNFTs.filter(n => n.status === 'minted').length;
  const totalTransactions = mockTransactions.length;
  const totalValue = mockNFTs.filter(n => n.price > 0).reduce((sum, n) => sum + n.price, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ContainerOutlined className="text-2xl text-purple-600" />
            <h1 className="text-2xl font-bold m-0">内容NFT</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>创建NFT</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="NFT总数" value={totalNFTs} valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">NFT总数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已铸造" value={mintedNFTs} suffix={`/${totalNFTs}`} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">已铸造NFT</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="交易次数" value={totalTransactions} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">总交易数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总价值(ETH)" value={totalValue} precision={2} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">NFT总价值</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="NFT统计">
              <SafeECharts option={nftChartOption} style={{ height: 250 }} title="NFT统计" />
            </Card>
          </Col>
        </Row>

        <Card title="NFT列表">
          <Table
            dataSource={mockNFTs}
            columns={nftColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Card title="交易记录">
          <Table
            dataSource={mockTransactions}
            columns={transactionColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={selectedNFT ? (selectedNFT.status === 'draft' ? `铸造NFT - ${selectedNFT.name}` : `NFT详情 - ${selectedNFT.name}`) : '创建NFT'}
          open={isModalVisible}
          onOk={() => {
            form.validateFields().then(() => {
              Modal.success({ title: '操作成功', content: selectedNFT ? 'NFT已更新！' : 'NFT已创建！' });
              setIsModalVisible(false);
              setSelectedNFT(null);
            });
          }}
          onCancel={() => {
            setIsModalVisible(false);
            setSelectedNFT(null);
          }}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="NFT名称" name="name" rules={[{ required: true, message: '请输入NFT名称' }]}>
              <Input placeholder="例如：孔子画像NFT" />
            </Form.Item>
            <Form.Item label="内容类型" name="type" rules={[{ required: true, message: '请选择内容类型' }]}>
              <Select placeholder="请选择内容类型">
                <Option value="国学动漫">国学动漫</Option>
                <Option value="真人短剧">真人短剧</Option>
                <Option value="非遗内容">非遗内容</Option>
              </Select>
            </Form.Item>
            <Form.Item label="价格(ETH)" name="price">
              <InputNumber placeholder="NFT价格" step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="NFT描述">
              <Input.TextArea rows={4} placeholder="请输入NFT描述" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}