'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Badge, Progress, Statistic, Image } from 'antd';
import { ContainerOutlined, PlusOutlined, EditOutlined, EyeOutlined, ArrowUpOutlined, ArrowDownOutlined, ShopOutlined, StockOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockBlindBoxes = [
  { id: '1', name: '国学院限量盲盒', price: 99, totalStock: 1000, soldCount: 650, remainingStock: 350, status: 'active', category: 'limited', revenue: 64350, createdAt: '2024-05-01' },
  { id: '2', name: '经典国学盲盒', price: 49, totalStock: 5000, soldCount: 3200, remainingStock: 1800, status: 'active', category: 'classic', revenue: 156800, createdAt: '2024-04-15' },
  { id: '3', name: '春节特别盲盒', price: 199, totalStock: 2000, soldCount: 2000, remainingStock: 0, status: 'sold_out', category: 'special', revenue: 398000, createdAt: '2024-02-01' },
  { id: '4', name: '非遗传承盲盒', price: 149, totalStock: 3000, soldCount: 0, remainingStock: 3000, status: 'upcoming', category: 'heritage', revenue: 0, createdAt: '2024-06-01' },
];

const mockBlindBoxPrizes = [
  { id: '1', blindBoxId: '1', prizeName: '孔子像NFT', rarity: 'legendary', probability: 0.5, totalCount: 5, awarded: 2, image: 'https://via.placeholder.com/100' },
  { id: '2', blindBoxId: '1', prizeName: '书法真迹', rarity: 'epic', probability: 2.0, totalCount: 20, awarded: 12, image: 'https://via.placeholder.com/100' },
  { id: '3', blindBoxId: '1', prizeName: '国学经典书籍', rarity: 'rare', probability: 10.0, totalCount: 100, awarded: 65, image: 'https://via.placeholder.com/100' },
  { id: '4', blindBoxId: '1', prizeName: '纪念徽章', rarity: 'common', probability: 87.5, totalCount: 875, awarded: 571, image: 'https://via.placeholder.com/100' },
];

const salesTrendOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value', name: '销量' },
  series: [
    { type: 'bar', data: [50, 80, 120, 90, 150, 200, 180], itemStyle: { color: '#7C3AED' }, name: '销量' },
  ],
};

export default function BlindBoxPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPrizeModalVisible, setIsPrizeModalVisible] = useState(false);
  const [editingBlindBox, setEditingBlindBox] = useState<any>(null);
  const [selectedBlindBox, setSelectedBlindBox] = useState<any>(null);
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

  const blindBoxColumns = [
    { 
      title: '盲盒封面', 
      key: 'cover', 
      width: 100, 
      render: () => <Image src="https://via.placeholder.com/60" style={{ borderRadius: 4 }} />,
    },
    { title: '盲盒名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-purple-600">{text}</span> },
    { title: '售价', dataIndex: 'price', key: 'price', render: (val: number) => `$${val}` },
    { 
      title: '库存状态', 
      key: 'stock', 
      render: (_: any, record: any) => (
        <div>
          <div>库存: {record.remainingStock}/{record.totalStock}</div>
          <Progress percent={Math.round((record.remainingStock / record.totalStock) * 100)} size="small" status={record.remainingStock === 0 ? 'exception' : 'normal'} />
        </div>
      ),
    },
    { title: '已售', dataIndex: 'soldCount', key: 'soldCount', render: (val: number) => val.toLocaleString() },
    { title: '销售额', dataIndex: 'revenue', key: 'revenue', render: (val: number) => `$${val.toLocaleString()}` },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const config: Record<string, { color: 'success' | 'warning' | 'default' | 'error'; label: string }> = {
          active: { color: 'success', label: '上架中' },
          upcoming: { color: 'warning', label: '即将上架' },
          sold_out: { color: 'default', label: '已售罄' },
          offline: { color: 'error', label: '已下架' },
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
          <Button type="link" size="small" icon={<EyeOutlined />} onClick={() => handleViewPrizes(record)}>奖品</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === 'active' ? (
            <Button type="link" size="small" danger>下架</Button>
          ) : record.status === 'upcoming' ? (
            <Button type="link" size="small">上架</Button>
          ) : null}
        </Space>
      ),
    },
  ];

  const prizeColumns = [
    { title: '奖品图片', key: 'image', width: 80, render: (_: any, record: any) => <Image src={record.image} style={{ width: 60, height: 60, borderRadius: 4 }} /> },
    { title: '奖品名称', dataIndex: 'prizeName', key: 'prizeName' },
    { 
      title: '稀有度', 
      dataIndex: 'rarity', 
      key: 'rarity', 
      render: (rarity: string) => <Tag color={rarityColors[rarity as keyof typeof rarityColors]}>{rarityLabels[rarity as keyof typeof rarityLabels]}</Tag>,
    },
    { title: '中奖概率', dataIndex: 'probability', key: 'probability', render: (val: number) => `${val}%` },
    { 
      title: '数量', 
      key: 'count', 
      render: (_: any, record: any) => `${record.awarded}/${record.totalCount}`,
    },
    { 
      title: '进度', 
      key: 'progress', 
      render: (_: any, record: any) => <Progress percent={Math.round((record.awarded / record.totalCount) * 100)} size="small" />,
    },
  ];

  const handleAdd = () => {
    setEditingBlindBox(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingBlindBox(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleViewPrizes = (record: any) => {
    setSelectedBlindBox(record);
    setIsPrizeModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(() => {
      Modal.success({ title: '操作成功', content: editingBlindBox ? '盲盒已更新！' : '盲盒已创建！' });
      setIsModalVisible(false);
    });
  };

  const totalBlindBoxes = mockBlindBoxes.length;
  const activeBlindBoxes = mockBlindBoxes.filter(b => b.status === 'active').length;
  const totalRevenue = mockBlindBoxes.reduce((sum, b) => sum + b.revenue, 0);
  const totalSold = mockBlindBoxes.reduce((sum, b) => sum + b.soldCount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ContainerOutlined className="text-2xl text-purple-600" />
            <h1 className="text-2xl font-bold m-0">盲盒系统</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>创建盲盒</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="盲盒总数" value={totalBlindBoxes} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">盲盒种类数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="上架中" value={activeBlindBoxes} suffix={`/${totalBlindBoxes}`} valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">活跃盲盒数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总销售额" value={(totalRevenue / 10000).toFixed(2)} prefix="$" suffix="万" valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">所有盲盒累计</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总销量" value={totalSold.toLocaleString()} valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">累计售出盲盒</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="销售趋势">
              <SafeECharts option={salesTrendOption} style={{ height: 250 }} title="销售趋势" />
            </Card>
          </Col>
        </Row>

        <Card title="盲盒列表">
          <Table
            dataSource={mockBlindBoxes}
            columns={blindBoxColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={editingBlindBox ? '编辑盲盒' : '创建盲盒'}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="盲盒名称" name="name" rules={[{ required: true, message: '请输入盲盒名称' }]}>
              <Input placeholder="例如：国学院限量盲盒" />
            </Form.Item>
            <Form.Item label="售价($)" name="price" rules={[{ required: true, message: '请输入售价' }]}>
              <InputNumber placeholder="售价" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="总库存" name="totalStock" rules={[{ required: true, message: '请输入总库存' }]}>
              <InputNumber placeholder="总库存" style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="分类" name="category">
              <Select placeholder="选择分类">
                <Option value="limited">限量版</Option>
                <Option value="classic">经典版</Option>
                <Option value="special">特别版</Option>
                <Option value="heritage">非遗版</Option>
              </Select>
            </Form.Item>
            <Form.Item label="盲盒描述">
              <Input.TextArea rows={3} placeholder="请输入盲盒描述..." />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title={`${selectedBlindBox?.name} - 奖品配置`}
          open={isPrizeModalVisible}
          onCancel={() => setIsPrizeModalVisible(false)}
          width={900}
          footer={[
            <Button key="close" onClick={() => setIsPrizeModalVisible(false)}>关闭</Button>,
            <Button key="add" type="primary" icon={<PlusOutlined />}>添加奖品</Button>,
          ]}
        >
          <Table
            dataSource={mockBlindBoxPrizes}
            columns={prizeColumns}
            pagination={false}
            rowKey="id"
          />
        </Modal>
      </div>
    </AdminLayout>
  );
}
