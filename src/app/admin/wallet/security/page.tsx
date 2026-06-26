'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Form, Input, Select, Switch, Modal, message } from 'antd';
import { PlusOutlined, EditOutlined, EyeOutlined, CheckCircleOutlined, CloseCircleOutlined, SecurityScanOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

interface SecurityPolicy {
  id: string;
  name: string;
  type: string;
  threshold: number;
  action: string;
  enabled: boolean;
  description: string;
}

const mockPolicies: SecurityPolicy[] = [
  { id: '1', name: '提现审核阈值', type: 'withdraw', threshold: 10000, action: 'approve', enabled: true, description: '单笔提现超过 10,000 USD 需要人工审核' },
  { id: '2', name: '每日提现限额', type: 'daily_limit', threshold: 50000, action: 'block', enabled: true, description: '每日提现总额超过 50,000 USD 后阻止' },
  { id: '3', name: '新地址白名单', type: 'whitelist', threshold: 0, action: 'require', enabled: false, description: '新地址首次交易需要白名单验证' },
  { id: '4', name: '异常活动检测', type: 'anomaly', threshold: 0, action: 'alert', enabled: true, description: '检测异常交易模式并报警' },
  { id: '5', name: '多签验证', type: 'multisig', threshold: 2, action: 'require', enabled: true, description: '大额交易需要多签验证' },
];

export default function SecurityPolicyPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<SecurityPolicy | null>(null);
  const [form] = Form.useForm();

  const showModal = (policy: SecurityPolicy | null = null) => {
    if (policy) {
      setEditingPolicy(policy);
      form.setFieldsValue(policy);
    } else {
      setEditingPolicy(null);
      form.resetFields();
    }
    setIsModalVisible(true);
  };

  const handleOk = () => {
    form.validateFields().then(() => {
      message.success(editingPolicy ? '安全策略已更新' : '安全策略已创建');
      setIsModalVisible(false);
      form.resetFields();
    });
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const togglePolicy = (policy: SecurityPolicy) => {
    message.success(policy.enabled ? '策略已禁用' : '策略已启用');
  };

  const columns = [
    { title: '策略名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold">{text}</span> },
    { title: '类型', dataIndex: 'type', key: 'type' },
    { title: '阈值', dataIndex: 'threshold', key: 'threshold', render: (val: number, record: SecurityPolicy) => record.type === 'whitelist' || record.type === 'anomaly' ? '-' : val.toLocaleString() },
    { 
      title: '动作', 
      dataIndex: 'action', 
      key: 'action',
      render: (action: string) => {
        const labels: Record<string, string> = {
          approve: '审核',
          block: '阻止',
          require: '要求',
          alert: '报警'
        };
        return <Tag color="blue">{labels[action] || action}</Tag>;
      }
    },
    { 
      title: '状态', 
      dataIndex: 'enabled', 
      key: 'enabled',
      render: (val: boolean, record: SecurityPolicy) => (
        <Switch 
          checked={val} 
          onChange={() => togglePolicy(record)}
          checkedChildren={<CheckCircleOutlined />}
          unCheckedChildren={<CloseCircleOutlined />}
        />
      )
    },
    { 
      title: '操作', 
      key: 'action',
      render: (_: any, record: SecurityPolicy) => (
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
            <SecurityScanOutlined className="text-2xl text-indigo-600" />
            <h1 className="text-2xl font-bold m-0">安全策略</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => showModal()}>
            添加策略
          </Button>
        </div>

        <Row gutter={16} className="mb-4">
          <Col span={6}>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-indigo-600">{mockPolicies.length}</div>
                <div className="text-gray-500">总策略数</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{mockPolicies.filter(p => p.enabled).length}</div>
                <div className="text-gray-500">已启用</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-red-600">{mockPolicies.filter(p => !p.enabled).length}</div>
                <div className="text-gray-500">已禁用</div>
              </div>
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">5</div>
                <div className="text-gray-500">触发次数</div>
              </div>
            </Card>
          </Col>
        </Row>

        <Card>
          <Table
            dataSource={mockPolicies}
            columns={columns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={editingPolicy ? '编辑安全策略' : '添加安全策略'}
          open={isModalVisible}
          onOk={handleOk}
          onCancel={handleCancel}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="策略名称" name="name" rules={[{ required: true, message: '请输入策略名称' }]}>
              <Input placeholder="输入策略名称" />
            </Form.Item>
            <Form.Item label="类型" name="type" rules={[{ required: true, message: '请选择类型' }]}>
              <Select placeholder="选择类型">
                <Option value="withdraw">提现</Option>
                <Option value="daily_limit">每日限额</Option>
                <Option value="whitelist">白名单</Option>
                <Option value="anomaly">异常检测</Option>
                <Option value="multisig">多签验证</Option>
              </Select>
            </Form.Item>
            <Form.Item label="阈值" name="threshold">
              <Input type="number" placeholder="输入阈值" />
            </Form.Item>
            <Form.Item label="动作" name="action" rules={[{ required: true, message: '请选择动作' }]}>
              <Select placeholder="选择动作">
                <Option value="approve">审核</Option>
                <Option value="block">阻止</Option>
                <Option value="require">要求验证</Option>
                <Option value="alert">报警</Option>
              </Select>
            </Form.Item>
            <Form.Item label="描述" name="description">
              <Input.TextArea placeholder="输入策略描述" rows={3} />
            </Form.Item>
            <Form.Item label="启用策略" name="enabled" valuePropName="checked">
              <Switch />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}