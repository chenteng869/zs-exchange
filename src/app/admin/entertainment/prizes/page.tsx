'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Progress, Statistic, Image } from 'antd';
import { GiftOutlined, PlusOutlined, EditOutlined, EyeOutlined, UploadOutlined, StockOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockPrizes = [
  { id: '1', name: '孔子像NFT', type: 'nft', rarity: 'legendary', value: 10000, totalStock: 100, remainingStock: 45, status: 'available', image: 'https://via.placeholder.com/100' },
  { id: '2', name: '书法真迹', type: 'physical', rarity: 'epic', value: 5000, totalStock: 50, remainingStock: 28, status: 'available', image: 'https://via.placeholder.com/100' },
  { id: '3', name: '1000 USDT', type: 'token', rarity: 'rare', value: 1000, totalStock: 1000, remainingStock: 450, status: 'available', image: 'https://via.placeholder.com/100' },
  { id: '4', name: '国学经典书籍', type: 'physical', rarity: 'common', value: 100, totalStock: 5000, remainingStock: 2300, status: 'available', image: 'https://via.placeholder.com/100' },
  { id: '5', name: '纪念徽章', type: 'physical', rarity: 'common', value: 50, totalStock: 10000, remainingStock: 0, status: 'out_of_stock', image: 'https://via.placeholder.com/100' },
  { id: '6', name: 'VIP会员年卡', type: 'membership', rarity: 'epic', value: 2000, totalStock: 200, remainingStock: 85, status: 'available', image: 'https://via.placeholder.com/100' },
];

const prizeDistributionOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['NFT', '实物', '代币', '会员', '其他'] },
  yAxis: { type: 'value', name: '数量' },
  series: [
    { type: 'bar', data: [100, 5000, 2000, 200, 1500], itemStyle: { color: '#16A34A' }, name: '库存' },
  ],
};

export default function PrizesPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPrize, setEditingPrize] = useState<any>(null);
  const [form] = Form.useForm();

  const rarityColors = {
    legendary: 'gold',
    epic: 'purple',
    rare: 'blue',
    common: 'gray',
  };

  const rarityLabels = {
    legendary: '传说',
    epic: '史诗',
    rare: '稀有',
    common: '普通',
  };

  const typeColors = {
    nft: 'purple',
    physical: 'blue',
    token: 'green',
    membership: 'orange',
  };

  const typeLabels = {
    nft: 'NFT',
    physical: '实物',
    token: '代币',
    membership: '会员',
  };

  const prizeColumns = [
    { 
      title: '奖品图片', 
      key: 'image', 
      width: 100, 
      render: (_: any, record: any) => <Image src={record.image} style={{ width: 60, height: 60, borderRadius: 8 }} />,
    },
    { title: '奖品名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-green-600">{text}</span> },
    { 
      title: '类型', 
      dataIndex: 'type', 
      key: 'type', 
      render: (type: string) => <Tag color={typeColors[type as keyof typeof typeColors]}>{typeLabels[type as keyof typeof typeLabels]}</Tag>,
    },
    { 
      title: '稀有度', 
      dataIndex: 'rarity', 
      key: 'rarity', 
      render: (rarity: string) => <Tag color={rarityColors[rarity as keyof typeof rarityColors]}>{rarityLabels[rarity as keyof typeof rarityLabels]}</Tag>,
    },
    { title: '价值', dataIndex: 'value', key: 'value', render: (val: number) => `$${val.toLocaleString()}` },
    { 
      title: '库存', 
      key: 'stock', 
      render: (_: any, record: any) => (
        <div>
          <div>{record.remainingStock}/{record.totalStock}</div>
          <Progress percent={Math.round((record.remainingStock / record.totalStock) * 100)} size="small" status={record.remainingStock === 0 ? 'exception' : 'normal'} />
        </div>
      ),
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const config: Record<string, { color: 'success' | 'default' | 'error'; label: string }> = {
          available: { color: 'success', label: '可兑换' },
          out_of_stock: { color: 'default', label: '已售罄' },
          disabled: { color: 'error', label: '已下架' },
        };
        const c = config[status];
        return <Badge status={c?.color} text={c?.label} />;
      },
    },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === 'available' ? (
            <Button type="link" size="small" danger>下架</Button>
          ) : record.status === 'disabled' ? (
            <Button type="link" size="small">上架</Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingPrize(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingPrize(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(() => {
      Modal.success({ title: '操作成功', content: editingPrize ? '奖品已更新！' : '奖品已创建！' });
      setIsModalVisible(false);
    });
  };

  const totalPrizes = mockPrizes.length;
  const availablePrizes = mockPrizes.filter(p => p.status === 'available').length;
  const totalStock = mockPrizes.reduce((sum, p) => sum + p.totalStock, 0);
  const totalValue = mockPrizes.reduce((sum, p) => sum + (p.value * p.totalStock), 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GiftOutlined className="text-2xl text-green-600" />
            <h1 className="text-2xl font-bold m-0">奖品管理</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加奖品</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="奖品种类" value={totalPrizes} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">不同奖品数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="可兑换" value={availablePrizes} suffix={`/${totalPrizes}`} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">可兑换奖品数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总库存" value={totalStock.toLocaleString()} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">所有奖品库存</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总价值" value={(totalValue / 10000).toFixed(2)} prefix="$" suffix="万" valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">奖品总价值</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="奖品分布">
              <SafeECharts option={prizeDistributionOption} style={{ height: 250 }} title="奖品分布" />
            </Card>
          </Col>
        </Row>

        <Card title="奖品列表">
          <Table
            dataSource={mockPrizes}
            columns={prizeColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={editingPrize ? '编辑奖品' : '添加奖品'}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="奖品图片" name="image">
              <Button icon={<UploadOutlined />}>上传图片</Button>
            </Form.Item>
            <Form.Item label="奖品名称" name="name" rules={[{ required: true, message: '请输入奖品名称' }]}>
              <Input placeholder="例如：孔子像NFT" />
            </Form.Item>
            <Form.Item label="奖品类型" name="type" rules={[{ required: true, message: '请选择奖品类型' }]}>
              <Select placeholder="选择奖品类型">
                <Option value="nft">NFT</Option>
                <Option value="physical">实物</Option>
                <Option value="token">代币</Option>
                <Option value="membership">会员</Option>
              </Select>
            </Form.Item>
            <Form.Item label="稀有度" name="rarity" rules={[{ required: true, message: '请选择稀有度' }]}>
              <Select placeholder="选择稀有度">
                <Option value="legendary">传说</Option>
                <Option value="epic">史诗</Option>
                <Option value="rare">稀有</Option>
                <Option value="common">普通</Option>
              </Select>
            </Form.Item>
            <Form.Item label="价值($)" name="value" rules={[{ required: true, message: '请输入奖品价值' }]}>
              <InputNumber placeholder="奖品价值" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="总库存" name="totalStock" rules={[{ required: true, message: '请输入总库存' }]}>
              <InputNumber placeholder="总库存" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="奖品描述" name="description">
              <Input.TextArea rows={3} placeholder="请输入奖品描述..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
