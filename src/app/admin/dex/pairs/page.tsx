'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, InputNumber, Select, Switch, Badge } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined, ArrowUpOutlined, ArrowDownOutlined, SettingOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

// 模拟交易对数据
const mockPairs = [
  { id: '1', name: 'GXT/USDT', tokenA: 'GXT', tokenB: 'USDT', price: 0.8523, change24h: 2.56, volume24h: 1250000, liquidity: 8500000, feeRate: 0.3, enabled: true, popular: true },
  { id: '2', name: 'ETH/USDT', tokenA: 'ETH', tokenB: 'USDT', price: 3285.50, change24h: -1.23, volume24h: 3200000, liquidity: 15200000, feeRate: 0.3, enabled: true, popular: true },
  { id: '3', name: 'BTC/USDT', tokenA: 'BTC', tokenB: 'USDT', price: 67523.80, change24h: 0.85, volume24h: 2800000, liquidity: 12800000, feeRate: 0.3, enabled: true, popular: true },
  { id: '4', name: 'BNB/USDT', tokenA: 'BNB', tokenB: 'USDT', price: 612.35, change24h: -0.45, volume24h: 850000, liquidity: 4200000, feeRate: 0.3, enabled: true, popular: false },
  { id: '5', name: 'SOL/USDT', tokenA: 'SOL', tokenB: 'USDT', price: 178.90, change24h: 1.85, volume24h: 720000, liquidity: 3800000, feeRate: 0.3, enabled: false, popular: false },
];

// 模拟代币列表
const mockTokens = [
  { id: '1', symbol: 'GXT', name: 'GXT Token', decimals: 18, price: 0.8523, priceChange: 2.56, volume: 1250000, active: true },
  { id: '2', symbol: 'USDT', name: 'Tether', decimals: 6, price: 1.0, priceChange: 0.01, volume: 85000000, active: true },
  { id: '3', symbol: 'ETH', name: 'Ethereum', decimals: 18, price: 3285.50, priceChange: -1.23, volume: 15200000, active: true },
  { id: '4', symbol: 'BTC', name: 'Bitcoin', decimals: 8, price: 67523.80, priceChange: 0.85, volume: 12800000, active: true },
  { id: '5', symbol: 'BNB', name: 'BNB', decimals: 18, price: 612.35, priceChange: -0.45, volume: 4200000, active: true },
];

export default function DexPairsPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPair, setEditingPair] = useState(null);
  const [form] = Form.useForm();

  const pairColumns = [
    { 
      title: '交易对', 
      dataIndex: 'name', 
      key: 'name', 
      render: (text: string, record: any) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-blue-600">{text}</span>
          {record.popular && <Tag color="orange">热门</Tag>}
        </div>
      ),
    },
    { 
      title: '价格', 
      dataIndex: 'price', 
      key: 'price', 
      render: (val: number) => `$${val.toLocaleString()}`,
    },
    { 
      title: '24h涨跌', 
      dataIndex: 'change24h', 
      key: 'change24h', 
      render: (val: number) => (
        <span className={val >= 0 ? 'text-green-600' : 'text-red-600'}>
          {val >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {val >= 0 ? '+' : ''}{val}%
        </span>
      ),
    },
    { title: '24h交易量', dataIndex: 'volume24h', key: 'volume24h', render: (val: number) => `$${(val / 1000000).toFixed(2)}M` },
    { title: '流动性', dataIndex: 'liquidity', key: 'liquidity', render: (val: number) => `$${(val / 1000000).toFixed(2)}M` },
    { title: '手续费率', dataIndex: 'feeRate', key: 'feeRate', render: (val: number) => `${val}%` },
    { 
      title: '状态', 
      dataIndex: 'enabled', 
      key: 'enabled', 
      render: (val: boolean) => <Tag color={val ? 'green' : 'red'}>{val ? '启用' : '停用'}</Tag>,
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

  const tokenColumns = [
    { title: '代币符号', dataIndex: 'symbol', key: 'symbol', render: (text: string) => <span className="font-semibold">{text}</span> },
    { title: '代币名称', dataIndex: 'name', key: 'name' },
    { title: '小数位', dataIndex: 'decimals', key: 'decimals' },
    { title: '当前价格', dataIndex: 'price', key: 'price', render: (val: number) => `$${val.toLocaleString()}` },
    { 
      title: '24h涨跌', 
      dataIndex: 'priceChange', 
      key: 'priceChange', 
      render: (val: number) => (
        <span className={val >= 0 ? 'text-green-600' : 'text-red-600'}>{val >= 0 ? '+' : ''}{val}%</span>
      ),
    },
    { 
      title: '状态', 
      dataIndex: 'active', 
      key: 'active', 
      render: (val: boolean) => <Badge status={val ? 'success' : 'default'} text={val ? '正常' : '禁用'} />,
    },
  ];

  const handleAdd = () => {
    setEditingPair(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingPair(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      Modal.success({
        title: editingPair ? '交易对更新成功' : '交易对创建成功',
        content: '操作已完成！',
      });
      setIsModalVisible(false);
    });
  };

  const totalLiquidity = mockPairs.filter(p => p.enabled).reduce((sum, p) => sum + p.liquidity, 0);
  const totalVolume = mockPairs.reduce((sum, p) => sum + p.volume24h, 0);
  const activePairs = mockPairs.filter(p => p.enabled).length;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SettingOutlined className="text-2xl text-purple-600" />
            <h1 className="text-2xl font-bold m-0">交易对管理</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加交易对
          </Button>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="text-gray-500 text-sm">总流动性</div>
              <div className="text-2xl font-bold text-purple-600">${(totalLiquidity / 1000000).toFixed(2)}M</div>
              <div className="text-green-500 text-sm mt-1">
                <ArrowUpOutlined /> +8.5% (24h)
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="text-gray-500 text-sm">24h交易量</div>
              <div className="text-2xl font-bold text-green-600">${(totalVolume / 1000000).toFixed(2)}M</div>
              <div className="text-green-500 text-sm mt-1">
                <ArrowUpOutlined /> +12.3% (24h)
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="text-gray-500 text-sm">活跃交易对</div>
              <div className="text-2xl font-bold text-blue-600">{activePairs}</div>
              <div className="text-gray-400 text-sm mt-1">总计: {mockPairs.length}</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="text-gray-500 text-sm">代币数</div>
              <div className="text-2xl font-bold text-orange-600">{mockTokens.length}</div>
              <div className="text-gray-400 text-sm mt-1">已上线: {mockTokens.filter(t => t.active).length}</div>
            </Card>
          </Col>
        </Row>

        {/* 交易对列表 */}
        <Card title="交易对列表">
          <Table
            dataSource={mockPairs}
            columns={pairColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        {/* 代币列表 */}
        <Card title="代币列表">
          <Table
            dataSource={mockTokens}
            columns={tokenColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        {/* 添加/编辑模态框 */}
        <Modal
          title={editingPair ? '编辑交易对' : '添加交易对'}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="代币A" name="tokenA" rules={[{ required: true, message: '请选择代币A' }]}>
                  <Select placeholder="选择代币A">
                    {mockTokens.map((t) => (
                      <Option key={t.id} value={t.symbol}>{t.symbol}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="代币B" name="tokenB" rules={[{ required: true, message: '请选择代币B' }]}>
                  <Select placeholder="选择代币B">
                    {mockTokens.map((t) => (
                      <Option key={t.id} value={t.symbol}>{t.symbol}</Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="手续费率 (%)" name="feeRate" rules={[{ required: true, message: '请输入手续费率' }]}>
                  <InputNumber min={0} max={10} step={0.01} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="是否热门" name="popular" valuePropName="checked">
                  <Switch />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="是否启用" name="enabled" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
