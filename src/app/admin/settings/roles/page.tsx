'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Badge, Statistic, Tree, message } from 'antd';
import { TeamOutlined, PlusOutlined, EditOutlined, DeleteOutlined, LockOutlined, ApiOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { DirectoryTree } = Tree;

// 模拟角色数据
const mockRoles = [
  { id: '1', name: '超级管理员', description: '拥有系统所有权限', userCount: 2, permissionCount: 156, status: 'active', createdAt: '2024-01-01' },
  { id: '2', name: '平台管理员', description: '管理平台日常运营', userCount: 5, permissionCount: 98, status: 'active', createdAt: '2024-02-15' },
  { id: '3', name: '内容管理员', description: '负责内容审核和发布', userCount: 8, permissionCount: 45, status: 'active', createdAt: '2024-03-10' },
  { id: '4', name: '财务审核员', description: '处理财务相关事务', userCount: 3, permissionCount: 32, status: 'active', createdAt: '2024-03-20' },
  { id: '5', name: '客服人员', description: '处理用户咨询和投诉', userCount: 12, permissionCount: 28, status: 'maintenance', createdAt: '2024-04-01' },
  { id: '6', name: '数据分析师', description: '查看和分析数据报表', userCount: 4, permissionCount: 22, status: 'active', createdAt: '2024-04-15' },
];

// 模拟权限树数据
const permissionTreeData = [
  {
    title: '用户管理',
    key: 'users',
    children: [
      { title: '查看用户', key: 'users:view' },
      { title: '创建用户', key: 'users:create' },
      { title: '编辑用户', key: 'users:edit' },
      { title: '删除用户', key: 'users:delete' },
      { title: 'KYC审核', key: 'users:kyc' },
    ],
  },
  {
    title: '交易管理',
    key: 'transactions',
    children: [
      { title: '查看交易', key: 'transactions:view' },
      { title: '处理充值', key: 'transactions:deposit' },
      { title: '处理提现', key: 'transactions:withdraw' },
      { title: '冻结账户', key: 'transactions:freeze' },
    ],
  },
  {
    title: 'DEX管理',
    key: 'dex',
    children: [
      { title: '交易对管理', key: 'dex:pairs' },
      { title: '流动性池', key: 'dex:pools' },
      { title: '挖矿池', key: 'dex:farming' },
    ],
  },
  {
    title: 'DeFi管理',
    key: 'defi',
    children: [
      { title: '质押管理', key: 'defi:staking' },
      { title: '借贷管理', key: 'defi:lending' },
      { title: '收益分配', key: 'defi:rewards' },
    ],
  },
  {
    title: '内容管理',
    key: 'content',
    children: [
      { title: '文章管理', key: 'content:articles' },
      { title: 'NFT管理', key: 'content:nfts' },
      { title: '游戏管理', key: 'content:games' },
    ],
  },
  {
    title: '系统设置',
    key: 'settings',
    children: [
      { title: '角色管理', key: 'settings:roles' },
      { title: '管理员配置', key: 'settings:admins' },
      { title: '系统配置', key: 'settings:config' },
    ],
  },
];

// 权限分布图表
const permissionDistributionOption = {
  tooltip: { trigger: 'item' },
  legend: { bottom: '5%', left: 'center' },
  series: [
    {
      name: '权限分布',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: [
        { value: 156, name: '超级管理员', itemStyle: { color: '#1677FF' } },
        { value: 98, name: '平台管理员', itemStyle: { color: '#16A34A' } },
        { value: 45, name: '内容管理员', itemStyle: { color: '#7C3AED' } },
        { value: 32, name: '财务审核员', itemStyle: { color: '#F59E0B' } },
        { value: 28, name: '客服人员', itemStyle: { color: '#06B6D4' } },
        { value: 22, name: '数据分析师', itemStyle: { color: '#EC4899' } },
      ],
    },
  ],
};

// 用户增长趋势图
const userGrowthOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['1月', '2月', '3月', '4月', '5月', '6月'] },
  yAxis: { type: 'value' },
  series: [
    { type: 'line', smooth: true, data: [5, 8, 12, 18, 25, 34], areaStyle: { color: 'rgba(24, 144, 255, 0.3)' }, itemStyle: { color: '#1677FF' }, name: '管理员数量' },
  ],
};

export default function RolesPermissionPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<any>(null);
  const [form] = Form.useForm();
  const [checkedKeys, setCheckedKeys] = useState<React.Key[]>([]);

  const roleColumns = [
    { 
      title: '角色名称', 
      dataIndex: 'name', 
      key: 'name', 
      render: (text: string, record: any) => (
        <div className="flex items-center gap-2">
          <TeamOutlined className="text-blue-500" />
          <span className="font-semibold text-blue-600">{text}</span>
        </div>
      ),
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    { 
      title: '用户数', 
      dataIndex: 'userCount', 
      key: 'userCount', 
      render: (val: number) => <span className="text-purple-600 font-semibold">{val}</span>,
    },
    { 
      title: '权限数', 
      dataIndex: 'permissionCount', 
      key: 'permissionCount', 
      render: (val: number) => <span className="text-green-600 font-semibold">{val}</span>,
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const config: Record<string, { color: 'success' | 'warning' | 'default'; label: string }> = {
          active: { color: 'success', label: '启用' },
          maintenance: { color: 'warning', label: '维护中' },
          disabled: { color: 'default', label: '禁用' },
        };
        const c = config[status];
        return <Badge status={c?.color} text={c?.label} />;
      },
    },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt' },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)}>删除</Button>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingRole(null);
    setCheckedKeys([]);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingRole(record);
    form.setFieldsValue(record);
    // 模拟该角色已有的权限
    const mockPermissions = ['users:view', 'users:create', 'transactions:view', 'dex:pairs'];
    setCheckedKeys(mockPermissions);
    setIsModalVisible(true);
  };

  const handleDelete = (record: any) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除角色"${record.name}"吗？此操作不可恢复。`,
      onOk() {
        message.success('角色已删除');
      },
    });
  };

  const handleSave = () => {
    form.validateFields().then(() => {
      Modal.success({
        title: editingRole ? '角色更新成功' : '角色创建成功',
        content: '操作已完成！',
      });
      setIsModalVisible(false);
    });
  };

  const handleCheck = (keys: any) => {
    setCheckedKeys(keys.checked);
  };

  const totalRoles = mockRoles.length;
  const activeRoles = mockRoles.filter(r => r.status === 'active').length;
  const totalUsers = mockRoles.reduce((sum, r) => sum + r.userCount, 0);
  const totalPermissions = mockRoles.reduce((sum, r) => sum + r.permissionCount, 0);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LockOutlined className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold m-0">角色与权限管理</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>创建角色</Button>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="角色总数"
                value={totalRoles}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#1677FF' }}
              />
              <div className="text-gray-400 text-sm mt-1">系统角色数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="已分配权限"
                value={totalPermissions}
                prefix={<LockOutlined />}
                valueStyle={{ color: '#16A34A' }}
              />
              <div className="text-gray-400 text-sm mt-1">权限分配总数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="管理员用户"
                value={totalUsers}
                valueStyle={{ color: '#7C3AED' }}
              />
              <div className="text-gray-400 text-sm mt-1">活跃角色: {activeRoles}/{totalRoles}</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="API权限数"
                value={56}
                prefix={<ApiOutlined />}
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="text-gray-400 text-sm mt-1">接口权限总数</div>
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="权限分布">
              <SafeECharts option={permissionDistributionOption} style={{ height: 300 }} title="权限分布" />
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="管理员增长">
              <SafeECharts option={userGrowthOption} style={{ height: 300 }} title="管理员增长" />
            </Card>
          </Col>
        </Row>

        {/* 角色列表 */}
        <Card title="角色列表">
          <Table
            dataSource={mockRoles}
            columns={roleColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        {/* 新增/编辑角色模态框 */}
        <Modal
          title={editingRole ? '编辑角色' : '创建角色'}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          width={700}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="角色名称" name="name" rules={[{ required: true, message: '请输入角色名称' }]}>
              <Input placeholder="例如：内容审核员" />
            </Form.Item>
            <Form.Item label="角色描述" name="description">
              <Input.TextArea rows={2} placeholder="请输入角色描述..." />
            </Form.Item>
            <Form.Item label="状态" name="status" initialValue="active">
              <Select>
                <Option value="active">启用</Option>
                <Option value="maintenance">维护中</Option>
                <Option value="disabled">禁用</Option>
              </Select>
            </Form.Item>
            <Form.Item label="权限配置">
              <div className="border rounded p-4 max-h-80 overflow-y-auto">
                <DirectoryTree
                  checkable
                  defaultExpandAll
                  checkedKeys={checkedKeys}
                  onCheck={handleCheck}
                  treeData={permissionTreeData}
                />
              </div>
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
