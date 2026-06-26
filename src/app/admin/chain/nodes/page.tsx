'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Badge, Progress, Statistic, InputNumber } from 'antd';
import { TrophyOutlined, PlusOutlined, PlayCircleOutlined, PauseCircleOutlined, EyeOutlined, EditOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockNodes = [
  { id: 'node-001', name: '主网节点-01', type: 'validator', status: 'active', location: '新加坡', ip: '10.0.0.1', port: 30303, blockHeight: 18542300, syncStatus: 'synced', latency: 12, uptime: 99.8, version: 'v1.12.0' },
  { id: 'node-002', name: '主网节点-02', type: 'validator', status: 'active', location: '东京', ip: '10.0.0.2', port: 30303, blockHeight: 18542298, syncStatus: 'syncing', latency: 25, uptime: 99.5, version: 'v1.12.0' },
  { id: 'node-003', name: '备用节点-01', type: 'full', status: 'active', location: '法兰克福', ip: '10.0.0.3', port: 30303, blockHeight: 18542300, syncStatus: 'synced', latency: 45, uptime: 98.2, version: 'v1.11.5' },
  { id: 'node-004', name: '归档节点-01', type: 'archive', status: 'inactive', location: '纽约', ip: '10.0.0.4', port: 30303, blockHeight: 18500000, syncStatus: 'stopped', latency: 0, uptime: 0, version: 'v1.12.0' },
  { id: 'node-005', name: '测试网节点-01', type: 'validator', status: 'active', location: '香港', ip: '10.0.0.5', port: 30303, blockHeight: 9876540, syncStatus: 'synced', latency: 8, uptime: 99.9, version: 'v1.12.0' },
  { id: 'node-006', name: '测试网节点-02', type: 'full', status: 'active', location: '新加坡', ip: '10.0.0.6', port: 30303, blockHeight: 9876538, syncStatus: 'syncing', latency: 15, uptime: 99.1, version: 'v1.11.8' },
];

export default function ChainNodesPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingNode, setEditingNode] = useState<any>(null);
  const [form] = Form.useForm();

  const columns = [
    { 
      title: '节点名称', 
      dataIndex: 'name', 
      key: 'name', 
      render: (text: string) => <span className="font-semibold text-blue-600">{text}</span>,
    },
    { 
      title: '节点类型', 
      dataIndex: 'type', 
      key: 'type', 
      render: (type: string) => {
        const types = { validator: '验证节点', full: '全节点', archive: '归档节点' };
        const colors = { validator: 'purple', full: 'blue', archive: 'orange' };
        return <Tag color={colors[type as keyof typeof colors]}>{types[type as keyof typeof types]}</Tag>;
      },
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const colors: Record<string, 'success' | 'error'> = { active: 'success', inactive: 'error' };
        const labels: Record<string, string> = { active: '运行中', inactive: '已停止' };
        return <Badge status={colors[status]} text={labels[status]} />;
      },
    },
    { title: '位置', dataIndex: 'location', key: 'location' },
    { title: 'IP地址', dataIndex: 'ip', key: 'ip', render: (text: string) => <code className="text-sm">{text}</code> },
    { title: '端口', dataIndex: 'port', key: 'port' },
    { 
      title: '同步状态', 
      dataIndex: 'syncStatus', 
      key: 'syncStatus', 
      render: (status: string) => {
        const statusConfig = {
          synced: { color: 'green', label: '已同步', icon: <CheckCircleOutlined /> },
          syncing: { color: 'blue', label: '同步中', icon: <ClockCircleOutlined /> },
          stopped: { color: 'gray', label: '已停止', icon: <ClockCircleOutlined /> },
        };
        const config = statusConfig[status as keyof typeof statusConfig];
        return <span className={`text-${config.color}-600`}>{config.icon} {config.label}</span>;
      },
    },
    { 
      title: '区块高度', 
      dataIndex: 'blockHeight', 
      key: 'blockHeight', 
      render: (val: number) => val.toLocaleString(),
    },
    { 
      title: '延迟(ms)', 
      dataIndex: 'latency', 
      key: 'latency', 
      render: (val: number) => <span className={val < 50 ? 'text-green-600' : val < 100 ? 'text-yellow-600' : 'text-red-600'}>{val}</span>,
    },
    { 
      title: '运行时间', 
      dataIndex: 'uptime', 
      key: 'uptime', 
      render: (val: number) => (
        <div>
          <Progress percent={val} strokeColor={val >= 99 ? '#16A34A' : val >= 95 ? '#F59E0B' : '#DC2626'} size="small" showInfo={false} />
          <span className="ml-2 text-sm">{val}%</span>
        </div>
      ),
    },
    { title: '版本', dataIndex: 'version', key: 'version' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          {record.status === 'active' ? (
            <Button type="link" danger size="small" icon={<PauseCircleOutlined />}>停止</Button>
          ) : (
            <Button type="link" size="small" icon={<PlayCircleOutlined />}>启动</Button>
          )}
          <Button type="link" size="small" icon={<ClockCircleOutlined />}>重启</Button>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingNode(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingNode(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then((values) => {
      Modal.success({
        title: editingNode ? '节点更新成功' : '节点创建成功',
        content: '操作已完成！',
      });
      setIsModalVisible(false);
    });
  };

  const totalNodes = mockNodes.length;
  const activeNodes = mockNodes.filter(n => n.status === 'active').length;
  const syncedNodes = mockNodes.filter(n => n.syncStatus === 'synced').length;
  const avgLatency = Math.round(mockNodes.filter(n => n.status === 'active').reduce((sum, n) => sum + n.latency, 0) / activeNodes);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrophyOutlined className="text-2xl text-purple-600" />
            <h1 className="text-2xl font-bold m-0">节点管理</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            添加节点
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总节点数" value={totalNodes} valueStyle={{ color: '#1677FF' }} />
              <div className="text-gray-400 text-sm mt-1">包含验证节点、全节点、归档节点</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="运行中节点" value={activeNodes} suffix={`/${totalNodes}`} valueStyle={{ color: '#16A34A' }} />
              <div className="text-green-500 text-sm mt-1">全部正常运行</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="已同步节点" value={syncedNodes} suffix={`/${activeNodes}`} valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">剩余节点同步中</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="平均延迟" value={avgLatency} suffix="ms" valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">网络延迟监控</div>
            </Card>
          </Col>
        </Row>

        <Card title="节点列表">
          <Table
            dataSource={mockNodes}
            columns={columns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        <Modal
          title={editingNode ? '编辑节点' : '添加节点'}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="节点名称" name="name" rules={[{ required: true, message: '请输入节点名称' }]}>
              <Input placeholder="例如：主网节点-01" />
            </Form.Item>
            <Form.Item label="节点类型" name="type" rules={[{ required: true, message: '请选择节点类型' }]}>
              <Select placeholder="选择节点类型">
                <Option value="validator">验证节点</Option>
                <Option value="full">全节点</Option>
                <Option value="archive">归档节点</Option>
              </Select>
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="IP地址" name="ip" rules={[{ required: true, message: '请输入IP地址' }]}>
                  <Input placeholder="10.0.0.1" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="端口" name="port" rules={[{ required: true, message: '请输入端口' }]}>
                  <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="地理位置" name="location">
              <Select placeholder="选择节点位置">
                <Option value="新加坡">新加坡</Option>
                <Option value="东京">东京</Option>
                <Option value="法兰克福">法兰克福</Option>
                <Option value="纽约">纽约</Option>
                <Option value="香港">香港</Option>
              </Select>
            </Form.Item>
            <Form.Item label="版本" name="version">
              <Input placeholder="v1.12.0" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}