'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Form, Input, InputNumber, Select, Switch, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, SettingOutlined, ArrowUpOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

interface APYConfig {
  id: string;
  poolName: string;
  token: string;
  baseAPY: number;
  tier1APY: number;
  tier2APY: number;
  tier3APY: number;
  tier1Threshold: string;
  tier2Threshold: string;
  tier3Threshold: string;
  enabled: boolean;
  lastUpdated: string;
}

const mockConfigs: APYConfig[] = [
  { id: '1', poolName: 'GXT 质押池', token: 'GXT', baseAPY: 8.0, tier1APY: 10.0, tier2APY: 12.5, tier3APY: 15.0, tier1Threshold: '1000', tier2Threshold: '10000', tier3Threshold: '100000', enabled: true, lastUpdated: '2026-05-10 10:00:00' },
  { id: '2', poolName: 'ETH 质押池', token: 'ETH', baseAPY: 5.0, tier1APY: 6.5, tier2APY: 8.2, tier3APY: 10.0, tier1Threshold: '1', tier2Threshold: '10', tier3Threshold: '100', enabled: true, lastUpdated: '2026-05-08 14:30:00' },
  { id: '3', poolName: 'BTC 质押池', token: 'BTC', baseAPY: 4.0, tier1APY: 5.0, tier2APY: 5.8, tier3APY: 6.5, tier1Threshold: '0.1', tier2Threshold: '1', tier3Threshold: '10', enabled: true, lastUpdated: '2026-05-05 09:15:00' },
  { id: '4', poolName: 'USDT 稳定池', token: 'USDT', baseAPY: 3.0, tier1APY: 3.5, tier2APY: 4.0, tier3APY: 4.5, tier1Threshold: '1000', tier2Threshold: '10000', tier3Threshold: '100000', enabled: true, lastUpdated: '2026-05-01 16:45:00' },
];

export default function APYConfigPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingConfig, setEditingConfig] = useState<APYConfig | null>(null);
  const [form] = Form.useForm();

  const showModal = (config: APYConfig | null = null) => {
    if (config) {
      setEditingConfig(config);
      form.setFieldsValue(config);
    } else {
      setEditingConfig(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(() => {
      message.success(editingConfig ? '收益率配置已更新' : '收益率配置已创建');
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const columns = [
    { title: '矿池名称', dataIndex: 'poolName', key: 'poolName', render: (text: string) => <span className="font-semibold">{text}</span> },
    { title: '代币', dataIndex: 'token', key: 'token', render: (text: string) => <Tag color="blue">{text}</Tag> },
    { title: '基础APY', dataIndex: 'baseAPY', key: 'baseAPY', render: (val: number) => <span className="text-green-600 font-semibold">{val}%</span> },
    { title: 'VIP1 APY', dataIndex: 'tier1APY', key: 'tier1APY', render: (val: number) => <span className="text-blue-600 font-semibold">{val}%</span> },
    { title: 'VIP2 APY', dataIndex: 'tier2APY', key: 'tier2APY', render: (val: number) => <span className="text-purple-600 font-semibold">{val}%</span> },
    { title: 'VIP3 APY', dataIndex: 'tier3APY', key: 'tier3APY', render: (val: number) => <span className="text-orange-600 font-semibold">{val}%</span> },
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
    { title: '更新时间', dataIndex: 'lastUpdated', key: 'lastUpdated' },
    { 
      title: '操作', 
      key: 'action',
      render: (_: any, record: APYConfig) => (
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
            <SettingOutlined className="text-2xl text-indigo-600" />
            <h1 className="text-2xl font-bold m-0">收益率配置</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            添加配置
          </Button>
        </div>

        <Card>
          <div className="flex items-center gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <ArrowUpOutlined className="text-xl text-green-600" />
            <div>
              <p className="font-semibold">收益率说明</p>
              <p className="text-sm text-gray-500">基础APY适用于普通质押用户，VIP等级根据质押金额自动升级，等级越高收益率越高</p>
            </div>
          </div>

          <Table
            dataSource={mockConfigs}
            columns={columns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={editingConfig ? '编辑收益率配置' : '添加收益率配置'}
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          width={700}
        >
          <Form form={form} layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="矿池名称" name="poolName" rules={[{ required: true, message: '请输入矿池名称' }]}>
                  <Input placeholder="如: GXT 质押池" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="质押代币" name="token" rules={[{ required: true, message: '请输入代币名称' }]}>
                  <Input placeholder="如: GXT" />
                </Form.Item>
              </Col>
            </Row>
            <div className="border-t pt-4 my-4">
              <p className="font-semibold mb-4">基础收益率</p>
              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label="基础APY (%)" name="baseAPY" rules={[{ required: true, message: '请输入基础APY' }]}>
                    <InputNumber style={{ width: '100%' }} placeholder="基础收益率" step={0.1} />
                  </Form.Item>
                </Col>
              </Row>
            </div>
            <div className="border-t pt-4 my-4">
              <p className="font-semibold mb-4">VIP等级配置</p>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="VIP1 APY (%)" name="tier1APY">
                    <InputNumber style={{ width: '100%' }} placeholder="VIP1收益率" step={0.1} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="阈值" name="tier1Threshold">
                    <Input placeholder="如: 1000" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <p className="text-sm text-gray-400 mt-2">代币数量</p>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="VIP2 APY (%)" name="tier2APY">
                    <InputNumber style={{ width: '100%' }} placeholder="VIP2收益率" step={0.1} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="阈值" name="tier2Threshold">
                    <Input placeholder="如: 10000" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <p className="text-sm text-gray-400 mt-2">代币数量</p>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label="VIP3 APY (%)" name="tier3APY">
                    <InputNumber style={{ width: '100%' }} placeholder="VIP3收益率" step={0.1} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label="阈值" name="tier3Threshold">
                    <Input placeholder="如: 100000" />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <p className="text-sm text-gray-400 mt-2">代币数量</p>
                </Col>
              </Row>
            </div>
            <Form.Item label="启用配置" name="enabled" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}