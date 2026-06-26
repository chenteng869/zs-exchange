'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Form, Input, InputNumber, Select, Switch, Modal, message, Statistic } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, SearchOutlined, WalletOutlined, ArrowUpOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

interface StakingPool {
  id: string;
  name: string;
  token: string;
  apy: number;
  minStake: string;
  maxStake: string;
  lockupPeriod: string;
  totalStaked: string;
  participants: number;
  status: string;
  enabled: boolean;
}

const mockPools: StakingPool[] = [
  { id: '1', name: 'GXT 质押池', token: 'GXT', apy: 12.5, minStake: '100', maxStake: '100000', lockupPeriod: '30天', totalStaked: '1,250,000', participants: 523, status: 'active', enabled: true },
  { id: '2', name: 'ETH 质押池', token: 'ETH', apy: 8.2, minStake: '0.1', maxStake: '100', lockupPeriod: '90天', totalStaked: '125.5', participants: 189, status: 'active', enabled: true },
  { id: '3', name: 'BTC 质押池', token: 'BTC', apy: 5.8, minStake: '0.01', maxStake: '10', lockupPeriod: '180天', totalStaked: '25.8', participants: 67, status: 'active', enabled: true },
  { id: '4', name: 'USDT 稳定池', token: 'USDT', apy: 4.5, minStake: '100', maxStake: '1000000', lockupPeriod: '灵活', totalStaked: '500,000', participants: 892, status: 'active', enabled: true },
  { id: '5', name: 'BNB 质押池', token: 'BNB', apy: 15.0, minStake: '1', maxStake: '1000', lockupPeriod: '60天', totalStaked: '5,000', participants: 234, status: 'maintenance', enabled: false },
];

export default function StakingPoolsPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPool, setEditingPool] = useState<StakingPool | null>(null);
  const [form] = Form.useForm();

  const showModal = (pool: StakingPool | null = null) => {
    if (pool) {
      setEditingPool(pool);
      form.setFieldsValue(pool);
    } else {
      setEditingPool(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(() => {
      message.success(editingPool ? '矿池配置已更新' : '矿池已创建');
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    { title: '矿池名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold">{text}</span> },
    { title: '质押代币', dataIndex: 'token', key: 'token', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { 
      title: 'APY', 
      dataIndex: 'apy', 
      key: 'apy',
      render: (val: number) => <span className="text-green-600 font-semibold">{val}%</span>
    },
    { title: '最低质押', dataIndex: 'minStake', key: 'minStake', render: (text: string, record: StakingPool) => `${text} ${record.token}` },
    { title: '最高质押', dataIndex: 'maxStake', key: 'maxStake', render: (text: string, record: StakingPool) => `${text} ${record.token}` },
    { title: '锁定期', dataIndex: 'lockupPeriod', key: 'lockupPeriod' },
    { title: '总质押量', dataIndex: 'totalStaked', key: 'totalStaked', render: (text: string, record: StakingPool) => `${text} ${record.token}` },
    { title: '参与者', dataIndex: 'participants', key: 'participants' },
    { 
      title: '状态', 
      dataIndex: 'enabled', 
      key: 'enabled',
      render: (val: boolean) => (
        <Tag color={val ? 'green' : 'red'}>
          {val ? '运行中' : '维护中'}
        </Tag>
      )
    },
    { 
      title: '操作', 
      key: 'action',
      render: (_: any, record: StakingPool) => (
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
            <WalletOutlined className="text-2xl text-indigo-600" />
            <h1 className="text-2xl font-bold m-0">矿池管理</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            创建矿池
          </Button>
        </div>

        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic title="矿池总数" value={mockPools.length} prefix={<LockOutlined />} valueStyle={{ color: '#1677FF' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="总质押量" value="1,780,625.5" suffix=" GXT" prefix={<WalletOutlined />} valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="总参与者" value="1,905" prefix={<UserOutlined />} valueStyle={{ color: '#7C3AED' }} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="平均APY" value="8.8" suffix="%" prefix={<ArrowUpOutlined />} valueStyle={{ color: '#F59E0B' }} />
            </Card>
          </Col>
        </Row>

        <Card>
          <div className="flex gap-4 mb-4">
            <Form layout="inline">
              <Form.Item>
                <Input 
                  placeholder="搜索矿池" 
                  prefix={<SearchOutlined />}
                  style={{ width: 250 }}
                />
              </Form.Item>
              <Form.Item>
                <Select placeholder="筛选状态" style={{ width: 150 }}>
                  <Select.Option value="all">全部</Select.Option>
                  <Select.Option value="active">运行中</Select.Option>
                  <Select.Option value="maintenance">维护中</Select.Option>
                </Select>
              </Form.Item>
            </Form>
          </div>

          <Table
            dataSource={mockPools}
            columns={columns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={editingPool ? '编辑矿池' : '创建矿池'}
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="矿池名称" name="name" rules={[{ required: true, message: '请输入矿池名称' }]}>
                  <Input placeholder="如: GXT 质押池" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="质押代币" name="token" rules={[{ required: true, message: '请输入代币名称' }]}>
                  <Input placeholder="如: GXT" />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="APY (%)" name="apy" rules={[{ required: true, message: '请输入收益率' }]}>
                  <InputNumber style={{ width: '100%' }} placeholder="收益率" step={0.1} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="锁定期" name="lockupPeriod">
                  <Select placeholder="选择锁定期">
                    <Select.Option value="灵活">灵活</Select.Option>
                    <Select.Option value="7天">7天</Select.Option>
                    <Select.Option value="30天">30天</Select.Option>
                    <Select.Option value="60天">60天</Select.Option>
                    <Select.Option value="90天">90天</Select.Option>
                    <Select.Option value="180天">180天</Select.Option>
                    <Select.Option value="365天">365天</Select.Option>
                  </Select>
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="最低质押量" name="minStake" rules={[{ required: true, message: '请输入最低质押量' }]}>
                  <InputNumber style={{ width: '100%' }} placeholder="最低质押量" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="最高质押量" name="maxStake" rules={[{ required: true, message: '请输入最高质押量' }]}>
                  <InputNumber style={{ width: '100%' }} placeholder="最高质押量" />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="启用矿池" name="enabled" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}