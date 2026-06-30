﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿'use client';
import { logger } from '@/lib/logger';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, Switch, Space, message, Popconfirm, Badge, Statistic, Descriptions } from 'antd';
import {
  FireOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  PoweroffOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

// 防火墙状态模拟数据
const mockFirewallStatus = {
  enabled: true,
  totalRules: 48,
  activeRules: 42,
  todayBlocked: 1286,
  todayAllowed: 58420,
  uptime: '99.97%',
  lastUpdate: '2024-06-08 14:30:00',
};

// 防火墙规则模拟数据
interface FirewallRule {
  id: string;
  name: string;
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ANY';
  sourceIp: string;
  destinationPort: string;
  action: 'allow' | 'deny' | 'reject';
  priority: number;
  enabled: boolean;
  description: string;
  hitCount: number;
  createdAt: string;
  updatedAt: string;
}

const mockRules: FirewallRule[] = [
  { id: 'FW-001', name: '阻止SQL注入攻击源', protocol: 'TCP', sourceIp: '203.0.113.0/24', destinationPort: '443,80', action: 'deny', priority: 1, enabled: true, description: '拦截已知SQL注入攻击来源IP段', hitCount: 2568, createdAt: '2024-05-01', updatedAt: '2024-06-05' },
  { id: 'FW-002', name: '允许HTTPS流量', protocol: 'TCP', sourceIp: '0.0.0.0/0', destinationPort: '443', action: 'allow', priority: 10, enabled: true, description: '允许所有HTTPS入站流量', hitCount: 584230, createdAt: '2024-01-01', updatedAt: '2024-01-01' },
  { id: 'FW-003', name: '阻断DDoS攻击IP', protocol: 'ANY', sourceIp: '185.220.101.50', destinationPort: '*', action: 'reject', priority: 2, enabled: true, description: '拦截参与DDoS攻击的恶意IP', hitCount: 15420, createdAt: '2024-05-15', updatedAt: '2024-06-07' },
  { id: 'FW-004', name: '管理后台访问控制', protocol: 'TCP', sourceIp: '192.168.1.0/24', destinationPort: '3000', action: 'allow', priority: 5, enabled: true, description: '仅允许内网IP访问管理后台', hitCount: 8520, createdAt: '2024-02-10', updatedAt: '2024-05-20' },
  { id: 'FW-005', name: '区块链节点通信白名单', protocol: 'TCP', sourceIp: '10.0.0.0/8', destinationPort: '8545,9545', action: 'allow', priority: 8, enabled: true, description: '允许内网区块链节点RPC通信', hitCount: 125800, createdAt: '2024-03-01', updatedAt: '2024-06-01' },
  { id: 'FW-006', name: '阻止恶意爬虫', protocol: 'TCP', sourceIp: '45.33.32.0/24', destinationPort: '80,443', action: 'deny', priority: 3, enabled: true, description: '拦截已知恶意爬虫IP段', hitCount: 9850, createdAt: '2024-04-20', updatedAt: '2024-06-03' },
  { id: 'FW-007', name: 'API限速保护', protocol: 'TCP', sourceIp: '0.0.0.0/0', destinationPort: '3001', action: 'allow', priority: 15, enabled: true, description: 'API接口访问限速规则（配合应用层）', hitCount: 245000, createdAt: '2024-02-15', updatedAt: '2024-05-25' },
  { id: 'FW-008', name: '临时封锁可疑IP', protocol: 'ANY', sourceIp: '91.121.87.100', destinationPort: '*', action: 'reject', priority: 4, enabled: false, description: '可疑活动IP，待进一步分析后决定是否永久封禁', hitCount: 320, createdAt: '2024-06-07', updatedAt: '2024-06-07' },
  { id: 'FW-009', name: 'SSH访问限制', protocol: 'TCP', sourceIp: '172.16.0.0/16', destinationPort: '22', action: 'allow', priority: 6, enabled: true, description: '仅允许VPN网段SSH连接', hitCount: 1520, createdAt: '2024-01-15', updatedAt: '2024-04-10' },
  { id: 'FW-010', name: '阻止端口扫描', protocol: 'ANY', sourceIp: '0.0.0.0/0', destinationPort: '1-1024', action: 'deny', priority: 20, enabled: false, description: '阻止对低端口的扫描行为（影响范围大，谨慎启用）', hitCount: 0, createdAt: '2024-03-20', updatedAt: '2024-03-20' },
];

export default function FirewallPage() {
  const queryClient = useQueryClient();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [protocolFilter, setProtocolFilter] = useState<string>('');

  const { data: fwStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['firewall-status'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return mockFirewallStatus;
    },
  });

  // 规则切换启用/禁用
  const toggleRuleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      await new Promise(r => setTimeout(r, 300));
      return { id, enabled };
    },
    onSuccess: () => {
      message.success('规则状态更新成功');
      queryClient.invalidateQueries({ queryKey: ['firewall-status'] });
    },
  });

  // 删除规则
  const deleteRuleMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise(r => setTimeout(r, 300));
      return id;
    },
    onSuccess: () => {
      message.success('规则删除成功');
      queryClient.invalidateQueries({ queryKey: ['firewall-status'] });
    },
  });

  // 筛选规则
  const filteredRules = mockRules.filter(rule => {
    const matchSearch = !searchText ||
      rule.name.toLowerCase().includes(searchText.toLowerCase()) ||
      rule.id.toLowerCase().includes(searchText.toLowerCase());
    const matchProtocol = !protocolFilter || rule.protocol === protocolFilter;
    return matchSearch && matchProtocol;
  });

  // 打开新增弹窗
  const handleAdd = () => {
    setEditingRule(null);
    form.resetFields();
    setModalVisible(true);
  };

  // 打开编辑弹窗
  const handleEdit = (record: FirewallRule) => {
    setEditingRule(record);
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  // 提交表单
  const handleSubmit = async () => {
    try {
      await form.validateFields();
      await new Promise(r => setTimeout(r, 500));
      message.success(editingRule ? '规则更新成功' : '规则创建成功');
      setModalVisible(false);
      queryClient.invalidateQueries({ queryKey: ['firewall-status'] });
    } catch (error) {
      logger.error('表单验证失败:', error);
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '规则名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: FirewallRule) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-xs text-gray-400">{record.id}</div>
        </div>
      ),
    },
    {
      title: '协议',
      dataIndex: 'protocol',
      key: 'protocol',
      width: 80,
      render: (proto: string) => {
        const colors: Record<string, string> = { TCP: 'blue', UDP: 'green', ICMP: 'orange', ANY: 'purple' };
        return <Tag color={colors[proto]}>{proto}</Tag>;
      },
    },
    {
      title: '源地址',
      dataIndex: 'sourceIp',
      key: 'sourceIp',
      width: 150,
      render: (ip: string) => <span className="font-mono text-xs">{ip}</span>,
    },
    {
      title: '目标端口',
      dataIndex: 'destinationPort',
      key: 'destinationPort',
      width: 100,
      render: (port: string) => <code className="text-xs">{port}</code>,
    },
    {
      title: '动作',
      dataIndex: 'action',
      key: 'action',
      width: 80,
      render: (action: string) => {
        const configs: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
          allow: { color: 'green', text: '允许', icon: <CheckCircleOutlined /> },
          deny: { color: 'red', text: '拒绝', icon: <CloseCircleOutlined /> },
          reject: { color: 'orange', text: '拒绝(通知)', icon: <PoweroffOutlined /> },
        };
        const c = configs[action];
        return <Tag color={c.color} icon={c.icon}>{c.text}</Tag>;
      },
    },
    {
      title: '优先级',
      dataIndex: 'priority',
      key: 'priority',
      width: 80,
      sorter: (a: FirewallRule, b: FirewallRule) => a.priority - b.priority,
      render: (pri: number) => (
        <Tag color={pri <= 5 ? 'red' : pri <= 10 ? 'orange' : 'blue'}>{pri}</Tag>
      ),
    },
    {
      title: '命中次数',
      dataIndex: 'hitCount',
      key: 'hitCount',
      width: 100,
      render: (count: number) => count.toLocaleString(),
    },
    {
      title: '状态',
      key: 'status',
      width: 80,
      render: (_: any, record: FirewallRule) => (
        <Switch
          size="small"
          checked={record.enabled}
          onChange={(checked) => toggleRuleMutation.mutate({ id: record.id, enabled: checked })}
          checkedChildren="开"
          unCheckedChildren="关"
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_: any, record: FirewallRule) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Popconfirm
            title="确定删除该规则？"
            description="删除后不可恢复"
            onConfirm={() => deleteRuleMutation.mutate(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <FireOutlined className="text-2xl text-orange-600" />
          <h1 className="text-2xl font-bold m-0">防火墙管理中心</h1>
          <Badge status={fwStatus?.enabled ? 'success' : 'default'} text={fwStatus?.enabled ? '运行中' : '已关闭'} />
        </div>

        {/* 防火墙状态面板 */}
        <Card className="shadow-sm" title="防火墙状态概览">
          <Row gutter={[24, 16]}>
            <Col xs={12} sm={6}>
              <Statistic title="运行状态" value={fwStatus?.enabled ? '正常运行' : '已关闭'} prefix={fwStatus?.enabled ? <CheckCircleOutlined /> : <CloseCircleOutlined />} valueStyle={{ color: fwStatus?.enabled ? '#3f8600' : '#B91C1C' }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="规则总数" value={fwStatus?.totalRules || 0} prefix={<ApiOutlined />} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="生效规则" value={fwStatus?.activeRules || 0} valueStyle={{ color: '#1677FF' }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="今日拦截" value={fwStatus?.todayBlocked || 0} valueStyle={{ color: '#DC2626' }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="今日放行" value={fwStatus?.todayAllowed || 0} valueStyle={{ color: '#16A34A' }} />
            </Col>
            <Col xs={12} sm={6}>
              <Statistic title="可用率" value={fwStatus?.uptime || '0'} suffix="%" valueStyle={{ color: '#7C3AED' }} />
            </Col>
            <Col xs={24} sm={12}>
              <div className="text-sm text-gray-500 mt-2">
                最后更新: <span className="font-mono">{fwStatus?.lastUpdate || '-'}</span>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 规则列表 */}
        <Card
          title="防火墙规则列表"
          className="shadow-sm"
          extra={
            <Space>
              <Input.Search
                placeholder="搜索规则名称/ID"
                allowClear
                style={{ width: 220 }}
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                enterButton={<SearchOutlined />}
              />
              <Select
                placeholder="协议筛选"
                style={{ width: 120 }}
                allowClear
                value={protocolFilter || undefined}
                onChange={setProtocolFilter}
                options={[
                  { label: 'TCP', value: 'TCP' },
                  { label: 'UDP', value: 'UDP' },
                  { label: 'ICMP', value: 'ICMP' },
                  { label: 'ANY', value: 'ANY' },
                ]}
              />
              <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>新增规则</Button>
            </Space>
          }
        >
          <Table
            dataSource={filteredRules}
            columns={columns}
            rowKey="id"
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total) => `共 ${total} 条规则`,
            }}
            size="middle"
            loading={statusLoading}
            scroll={{ x: 1100 }}
          />
        </Card>

        {/* 新增/编辑规则弹窗 */}
        <Modal
          title={editingRule ? '编辑防火墙规则' : '新增防火墙规则'}
          open={modalVisible}
          onCancel={() => setModalVisible(false)}
          width={650}
          okText={editingRule ? '更新' : '创建'}
          onOk={handleSubmit}
        >
          <Form form={form} layout="vertical" className="mt-4">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="name" label="规则名称" rules={[{ required: true, message: '请输入规则名称' }]}>
                  <Input placeholder="请输入规则名称" prefix={<FireOutlined />} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="protocol" label="协议类型" rules={[{ required: true, message: '请选择协议' }]}>
                  <Select placeholder="请选择协议" options={[
                    { label: 'TCP', value: 'TCP' },
                    { label: 'UDP', value: 'UDP' },
                    { label: 'ICMP', value: 'ICMP' },
                    { label: 'ANY', value: 'ANY' },
                  ]} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <Form.Item name="sourceIp" label="源地址" rules={[{ required: true, message: '请输入源地址' }]}>
                  <Input placeholder="例如: 192.168.1.0/24 或 0.0.0.0/0" prefix={<ApiOutlined />} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name="destinationPort" label="目标端口" rules={[{ required: true, message: '请输入目标端口' }]}>
                  <Input placeholder="例如: 443 或 80,443 或 *" prefix={<ApiOutlined />} />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={8}>
                <Form.Item name="action" label="动作" rules={[{ required: true, message: '请选择动作' }]}>
                  <Select placeholder="请选择动作" options={[
                    { label: '允许 (Allow)', value: 'allow' },
                    { label: '拒绝 (Deny)', value: 'deny' },
                    { label: '拒绝并通知 (Reject)', value: 'reject' },
                  ]} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="priority" label="优先级" rules={[{ required: true, message: '请输入优先级' }]}>
                  <Input type="number" placeholder="1-255, 数字越小优先级越高" min={1} max={255} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item name="enabled" label="启用状态" valuePropName="checked">
                  <Switch checkedChildren="启用" unCheckedChildren="禁用" defaultChecked />
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="description" label="规则描述">
              <Input.TextArea rows={3} placeholder="请输入规则描述说明" />
            </Form.Item>
          </Form>
        </Modal>

        {/* 中萨交易所安全提示 */}
        <Card className="shadow-sm bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
          <div className="flex items-start gap-3">
            <FireOutlined className="text-xl text-orange-500 mt-1" />
            <div>
              <h4 className="font-bold text-orange-700 m-0 mb-1">防火墙安全提醒</h4>
              <p className="text-sm text-orange-600 m-0">
                防火墙是中萨数字科技交易所网络安全的第一道防线。当前共有{fwStatus?.activeRules || 0}条规则生效，
                今日已拦截{fwStatus?.todayBlocked || 0}次非法访问。请定期审查规则有效性，
                特别关注涉及区块链节点通信（端口8545/9545）和交易API（端口3001）的规则配置。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
