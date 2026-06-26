'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Form, Input, Select, Switch, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined, KeyOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

interface WalletAddress {
  id: string;
  address: string;
  chain: string;
  label: string;
  type: string;
  balance: string;
  status: string;
  enabled: boolean;
  createdAt: string;
}

const mockAddresses: WalletAddress[] = [
  { id: '1', address: '0x742d35Cc6634C0532925a3b8863317Dd27cE22A8', chain: 'Ethereum', label: '主钱包', type: 'hot', balance: '12.5 ETH', status: 'active', enabled: true, createdAt: '2026-01-15 10:30:00' },
  { id: '2', address: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t', chain: 'BSC', label: 'BSC 热钱包', type: 'hot', balance: '5000 BNB', status: 'active', enabled: true, createdAt: '2026-02-20 14:45:00' },
  { id: '3', address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', chain: 'Bitcoin', label: 'BTC 冷钱包', type: 'cold', balance: '150 BTC', status: 'active', enabled: true, createdAt: '2026-03-10 09:15:00' },
  { id: '4', address: '0xAbC123DeF456GhI789JkLmNoPqRsTuVwXyZ012345', chain: 'Polygon', label: 'Polygon 钱包', type: 'hot', balance: '10000 MATIC', status: 'maintenance', enabled: false, createdAt: '2026-04-05 16:20:00' },
  { id: '5', address: 'TQmKd12xL9r4t7u3v8w2x5y1z4a7b0c3d2e1f4a5', chain: 'TRON', label: 'TRX 钱包', type: 'hot', balance: '1000000 TRX', status: 'active', enabled: true, createdAt: '2026-05-01 11:00:00' },
];

export default function AddressManagementPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<WalletAddress | null>(null);
  const [form] = Form.useForm();

  const showModal = (address: WalletAddress | null = null) => {
    if (address) {
      setEditingAddress(address);
      form.setFieldsValue(address);
    } else {
      setEditingAddress(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(() => {
      message.success(editingAddress ? '钱包地址已更新' : '钱包地址已添加');
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    { title: '标签', dataIndex: 'label', key: 'label', render: (text: string) => <span className="font-semibold">{text}</span> },
    { title: '地址', dataIndex: 'address', key: 'address', render: (text: string) => <span className="font-mono text-sm">{text.slice(0, 10)}...{text.slice(-8)}</span> },
    { title: '公链', dataIndex: 'chain', key: 'chain' },
    { title: '类型', dataIndex: 'type', key: 'type', render: (type: string) => <Tag color={type === 'hot' ? 'orange' : 'blue'}>{type === 'hot' ? '热钱包' : '冷钱包'}</Tag> },
    { title: '余额', dataIndex: 'balance', key: 'balance' },
    { 
      title: '状态', 
      dataIndex: 'enabled', 
      key: 'enabled',
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'red'}>
          {val ? '启用' : '禁用'}
        </Tag>
      )
    },
    { 
      title: '操作', 
      key: 'action',
      render: (_: any, record: WalletAddress) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => showModal(record)}>编辑</Button>
        </Space>
      )
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <KeyOutlined className="text-2xl text-indigo-600" />
            <h1 className="text-2xl font-bold m-0">地址管理</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            添加地址
          </Button>
        </div>

        <Card>
          <div className="flex gap-4 mb-4">
            <Form layout="inline">
              <Form.Item>
                <Input 
                  placeholder="搜索地址或标签" 
                  prefix={<SearchOutlined />}
                  style={{ width: 250 }}
                />
              </Form.Item>
              <Form.Item>
                <Select placeholder="筛选公链" style={{ width: 150 }}>
                  <Select.Option value="all">全部</Select.Option>
                  <Select.Option value="Ethereum">Ethereum</Select.Option>
                  <Select.Option value="BSC">BSC</Select.Option>
                  <Select.Option value="Bitcoin">Bitcoin</Select.Option>
                  <Select.Option value="Polygon">Polygon</Select.Option>
                  <Select.Option value="TRON">TRON</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item>
                <Select placeholder="筛选类型" style={{ width: 150 }}>
                  <Select.Option value="all">全部</Select.Option>
                  <Select.Option value="hot">热钱包</Select.Option>
                  <Select.Option value="cold">冷钱包</Select.Option>
                </Select>
              </Form.Item>
            </Form>
          </div>

          <Table
            dataSource={mockAddresses}
            columns={columns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={editingAddress ? '编辑钱包地址' : '添加钱包地址'}
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="标签" name="label" rules={[{ required: true, message: '请输入标签' }]}>
                  <Input placeholder="如: 主钱包" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="公链" name="chain" rules={[{ required: true, message: '请选择公链' }]}>
                  <Select placeholder="选择公链">
                    <Select.Option value="Ethereum">Ethereum</Select.Option>
                    <Select.Option value="BSC">BSC</Select.Option>
                    <Select.Option value="Bitcoin">Bitcoin</Select.Option>
                    <Select.Option value="Polygon">Polygon</Select.Option>
                    <Select.Option value="TRON">TRON</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="钱包地址" name="address" rules={[{ required: true, message: '请输入钱包地址' }]}>
              <Input placeholder="输入钱包地址" />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="钱包类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
                  <Select placeholder="选择类型">
                    <Select.Option value="hot">热钱包</Select.Option>
                    <Select.Option value="cold">冷钱包</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="启用地址" name="enabled" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}