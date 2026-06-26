'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Progress, Modal, Form, Input, InputNumber, Select } from 'antd';
import { PlusOutlined, EyeOutlined, EditOutlined, DeleteOutlined, WalletOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

// 模拟流动性池数据
const mockPools = [
  { id: '1', name: 'GXT/USDT', tokenA: 'GXT', tokenB: 'USDT', tvl: 8500000, volume24h: 1250000, fee: 0.3, apr: 12.5, liquidity: 5200, active: true },
  { id: '2', name: 'ETH/USDT', tokenA: 'ETH', tokenB: 'USDT', tvl: 15200000, volume24h: 3200000, fee: 0.3, apr: 8.5, liquidity: 185, active: true },
  { id: '3', name: 'BTC/USDT', tokenA: 'BTC', tokenB: 'USDT', tvl: 12800000, volume24h: 2800000, fee: 0.3, apr: 9.2, liquidity: 42, active: true },
  { id: '4', name: 'BNB/USDT', tokenA: 'BNB', tokenB: 'USDT', tvl: 4200000, volume24h: 850000, fee: 0.3, apr: 7.8, liquidity: 320, active: true },
  { id: '5', name: 'SOL/USDT', tokenA: 'SOL', tokenB: 'USDT', tvl: 3800000, volume24h: 720000, fee: 0.3, apr: 10.5, liquidity: 2100, active: false },
];

// TVL 趋势图表
const tvlTrendOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value' },
  series: [
    { type: 'line', smooth: true, data: [38, 40, 42, 41, 44, 45, 46.5], areaStyle: {}, name: '总TVL' },
  ],
};

export default function DexPoolsPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPool, setEditingPool] = useState<any>(null);
  const [form] = Form.useForm();

  const columns = [
    {
      title: '流动性池',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-semibold text-blue-600">{text}</span>,
    },
    {
      title: 'TVL',
      dataIndex: 'tvl',
      key: 'tvl',
      render: (val: number) => `$${(val / 1000000).toFixed(2)}M`,
    },
    {
      title: '24h交易量',
      dataIndex: 'volume24h',
      key: 'volume24h',
      render: (val: number) => `$${(val / 1000000).toFixed(2)}M`,
    },
    {
      title: '交易手续费',
      dataIndex: 'fee',
      key: 'fee',
      render: (val: number) => `${val}%`,
    },
    {
      title: 'APR',
      dataIndex: 'apr',
      key: 'apr',
      render: (val: number) => <span className="text-green-600 font-semibold">{val}%</span>,
    },
    {
      title: '流动性',
      dataIndex: 'liquidity',
      key: 'liquidity',
    },
    {
      title: '状态',
      dataIndex: 'active',
      key: 'active',
      render: (val: boolean) => <Tag color={val ? 'green' : 'red'}>{val ? '活跃' : '暂停'}</Tag>,
    },
    {
      title: '操作',
      key: 'action',
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" danger size="small" icon={<DeleteOutlined />}>删除</Button>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingPool(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingPool(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      Modal.success({
        title: editingPool ? '流动性池更新成功' : '流动性池创建成功',
        content: '操作已完成！',
      });
      setIsModalVisible(false);
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WalletOutlined className="text-2xl text-purple-600" />
            <h1 className="text-2xl font-bold m-0">流动性池管理</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加流动性池
          </Button>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="text-gray-500 text-sm">总TVL</div>
              <div className="text-2xl font-bold text-green-600">$44.5M</div>
              <div className="text-green-500 text-sm mt-1">
                <ArrowUpOutlined /> +8.5% (24h)
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="text-gray-500 text-sm">24h交易量</div>
              <div className="text-2xl font-bold text-blue-600">$8.82M</div>
              <div className="text-green-500 text-sm mt-1">
                <ArrowUpOutlined /> +12.3% (24h)
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="text-gray-500 text-sm">活跃池数</div>
              <div className="text-2xl font-bold text-purple-600">4</div>
              <div className="text-gray-400 text-sm mt-1">总池数：5</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="text-gray-500 text-sm">平均APR</div>
              <div className="text-2xl font-bold text-orange-600">9.5%</div>
              <div className="text-red-500 text-sm mt-1">
                <ArrowDownOutlined /> -0.5% (24h)
              </div>
            </Card>
          </Col>
        </Row>

        {/* TVL趋势图 */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="TVL 增长趋势">
              <SafeECharts option={tvlTrendOption} style={{ height: 300 }} title="TVL 增长趋势" />
            </Card>
          </Col>
        </Row>

        {/* 流动性池列表 */}
        <Card title="流动性池列表">
          <Table
            dataSource={mockPools}
            columns={columns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        {/* 添加/编辑模态框 */}
        <Modal
          title={editingPool ? '编辑流动性池' : '添加流动性池'}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="Token A" name="tokenA" rules={[{ required: true }]}>
              <Select placeholder="选择 Token A">
                <Option value="GXT">GXT</Option>
                <Option value="ETH">ETH</Option>
                <Option value="BTC">BTC</Option>
                <Option value="BNB">BNB</Option>
                <Option value="SOL">SOL</Option>
              </Select>
            </Form.Item>
            <Form.Item label="Token B" name="tokenB" rules={[{ required: true }]}>
              <Select placeholder="选择 Token B">
                <Option value="USDT">USDT</Option>
                <Option value="USDC">USDC</Option>
              </Select>
            </Form.Item>
            <Form.Item label="交易手续费 (%)" name="fee" rules={[{ required: true }]}>
              <InputNumber min={0} max={10} step={0.01} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="目标APR (%)" name="apr" rules={[{ required: true }]}>
              <InputNumber min={0} max={100} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item label="状态" name="active" valuePropName="checked">
              <Select placeholder="选择状态">
                <Option value={true}>活跃</Option>
                <Option value={false}>暂停</Option>
              </Select>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
