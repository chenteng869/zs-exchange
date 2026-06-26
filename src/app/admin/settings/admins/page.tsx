'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Modal, Form, Input, Select, Badge, Statistic, Popconfirm, Avatar } from 'antd';
import { UserOutlined, PlusOutlined, EditOutlined, LockOutlined, DeleteOutlined, StopOutlined, CheckCircleOutlined, TeamOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

// 模拟管理员数据
const mockAdmins = [
  { id: '1', username: 'admin', name: '系统管理员', email: 'admin@example.com', role: 'super_admin', status: 'active', lastLogin: '2024-05-13 10:30:00', avatar: 'https://via.placeholder.com/40', createdAt: '2024-01-01' },
  { id: '2', username: 'manager', name: '运营经理', email: 'manager@example.com', role: 'admin', status: 'active', lastLogin: '2024-05-13 09:15:00', avatar: 'https://via.placeholder.com/40', createdAt: '2024-02-15' },
  { id: '3', username: 'editor', name: '内容编辑', email: 'editor@example.com', role: 'editor', status: 'active', lastLogin: '2024-05-12 18:45:00', avatar: 'https://via.placeholder.com/40', createdAt: '2024-03-10' },
  { id: '4', username: 'support', name: '客服专员', email: 'support@example.com', role: 'support', status: 'disabled', lastLogin: '2024-05-01 14:20:00', avatar: 'https://via.placeholder.com/40', createdAt: '2024-04-05' },
  { id: '5', username: 'finance', name: '财务主管', email: 'finance@example.com', role: 'finance', status: 'active', lastLogin: '2024-05-13 08:00:00', avatar: 'https://via.placeholder.com/40', createdAt: '2024-03-20' },
  { id: '6', username: 'intern', name: '实习生', email: 'intern@example.com', role: 'viewer', status: 'disabled', lastLogin: '2024-04-25 16:30:00', avatar: 'https://via.placeholder.com/40', createdAt: '2024-05-10' },
];

// 角色配置
const roleConfig = {
  super_admin: { label: '超级管理员', color: 'red' },
  admin: { label: '管理员', color: 'blue' },
  editor: { label: '内容编辑', color: 'green' },
  finance: { label: '财务', color: 'orange' },
  support: { label: '客服', color: 'cyan' },
  viewer: { label: '查看者', color: 'gray' },
};

// 管理员增长趋势图表
const adminGrowthOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['01-01', '02-01', '03-01', '04-01', '05-01', '05-13'] },
  yAxis: { type: 'value' },
  series: [
    { type: 'line', smooth: true, data: [1, 2, 3, 4, 5, 6], areaStyle: { color: 'rgba(24, 144, 255, 0.3)' }, itemStyle: { color: '#1677FF' }, name: '管理员数' },
  ],
};

export default function AdminUsersPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<any>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<any>(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  const adminColumns = [
    { 
      title: '头像', 
      key: 'avatar', 
      width: 80,
      render: (_: any, record: any) => (
        <Avatar src={record.avatar} icon={<UserOutlined />} />
      ),
    },
    { 
      title: '账号', 
      dataIndex: 'username', 
      key: 'username', 
      render: (text: string) => <span className="font-semibold text-blue-600">{text}</span>,
    },
    { title: '姓名', dataIndex: 'name', key: 'name' },
    { title: '邮箱', dataIndex: 'email', key: 'email' },
    { 
      title: '角色', 
      dataIndex: 'role', 
      key: 'role', 
      render: (role: string) => {
        const config = roleConfig[role as keyof typeof roleConfig];
        return <Tag color={config?.color}>{config?.label}</Tag>;
      },
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const config: Record<string, { color: 'success' | 'default'; label: string }> = {
          active: { color: 'success', label: '正常' },
          disabled: { color: 'default', label: '禁用' },
        };
        const c = config[status];
        return <Badge status={c?.color} text={c?.label} />;
      },
    },
    { title: '最后登录', dataIndex: 'lastLogin', key: 'lastLogin', width: 180 },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => (
        <Space size="small">
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)}>编辑</Button>
          <Button type="link" size="small" icon={<LockOutlined />} onClick={() => handleResetPassword(record)}>重置密码</Button>
          {record.status === 'active' ? (
            <Button type="link" size="small" danger icon={<StopOutlined />} onClick={() => handleToggleStatus(record, 'disabled')}>禁用</Button>
          ) : (
            <Button type="link" size="small" icon={<CheckCircleOutlined />} onClick={() => handleToggleStatus(record, 'active')}>启用</Button>
          )}
          <Popconfirm
            title="确定要删除这个管理员吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const handleAdd = () => {
    setEditingAdmin(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (record: any) => {
    setEditingAdmin(record);
    form.setFieldsValue(record);
    setIsModalVisible(true);
  };

  const handleResetPassword = (record: any) => {
    setSelectedAdmin(record);
    passwordForm.resetFields();
    setIsPasswordModalVisible(true);
  };

  const handleToggleStatus = (record: any, newStatus: string) => {
    Modal.success({
      title: '操作成功',
      content: `管理员 ${record.name} 已${newStatus === 'active' ? '启用' : '禁用'}！`,
    });
  };

  const handleDelete = (record: any) => {
    Modal.success({
      title: '删除成功',
      content: `管理员 ${record.name} 已删除！`,
    });
  };

  const handleSave = () => {
    form.validateFields().then(() => {
      Modal.success({
        title: editingAdmin ? '更新成功' : '创建成功',
        content: editingAdmin ? '管理员信息已更新！' : '新管理员已创建！',
      });
      setIsModalVisible(false);
    });
  };

  const handleSavePassword = () => {
    passwordForm.validateFields().then(() => {
      Modal.success({
        title: '重置成功',
        content: `管理员 ${selectedAdmin?.name} 的密码已重置！`,
      });
      setIsPasswordModalVisible(false);
    });
  };

  const totalAdmins = mockAdmins.length;
  const activeAdmins = mockAdmins.filter(a => a.status === 'active').length;
  const disabledAdmins = mockAdmins.filter(a => a.status === 'disabled').length;
  const todayNewAdmins = 2; // 模拟今日新增

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TeamOutlined className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold m-0">管理员管理</h1>
          </div>
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>添加管理员</Button>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="管理员总数"
                value={totalAdmins}
                valueStyle={{ color: '#1677FF' }}
              />
              <div className="text-gray-400 text-sm mt-1">系统管理员数量</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="在线管理员"
                value={activeAdmins}
                suffix={`/${totalAdmins}`}
                valueStyle={{ color: '#16A34A' }}
              />
              <div className="text-gray-400 text-sm mt-1">活跃管理员数</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="今日新增"
                value={todayNewAdmins}
                valueStyle={{ color: '#7C3AED' }}
              />
              <div className="text-gray-400 text-sm mt-1">新增管理员</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="禁用账号"
                value={disabledAdmins}
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="text-gray-400 text-sm mt-1">已禁用账号数</div>
            </Card>
          </Col>
        </Row>

        {/* 趋势图 */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="管理员增长趋势">
              <SafeECharts option={adminGrowthOption} style={{ height: 250 }} title="管理员增长趋势" />
            </Card>
          </Col>
        </Row>

        {/* 管理员列表 */}
        <Card title="管理员列表">
          <Table
            dataSource={mockAdmins}
            columns={adminColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        {/* 添加/编辑管理员模态框 */}
        <Modal
          title={editingAdmin ? '编辑管理员' : '添加管理员'}
          open={isModalVisible}
          onOk={handleSave}
          onCancel={() => setIsModalVisible(false)}
          width={600}
        >
          <Form form={form} layout="vertical">
            <Form.Item label="账号" name="username" rules={[{ required: true, message: '请输入账号' }]}>
              <Input placeholder="例如：admin" disabled={!!editingAdmin} />
            </Form.Item>
            <Form.Item label="姓名" name="name" rules={[{ required: true, message: '请输入姓名' }]}>
              <Input placeholder="例如：系统管理员" />
            </Form.Item>
            <Form.Item label="邮箱" name="email" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}>
              <Input placeholder="例如：admin@example.com" />
            </Form.Item>
            <Form.Item label="角色" name="role" rules={[{ required: true, message: '请选择角色' }]}>
              <Select placeholder="选择角色">
                {Object.entries(roleConfig).map(([key, config]) => (
                  <Option key={key} value={key}>{config.label}</Option>
                ))}
              </Select>
            </Form.Item>
            {!editingAdmin && (
              <Form.Item label="初始密码" name="password" rules={[{ required: true, message: '请输入初始密码' }, { min: 6, message: '密码长度至少6位' }]}>
                <Input.Password placeholder="请输入初始密码" />
              </Form.Item>
            )}
          </Form>
        </Modal>

        {/* 重置密码模态框 */}
        <Modal
          title="重置密码"
          open={isPasswordModalVisible}
          onOk={handleSavePassword}
          onCancel={() => setIsPasswordModalVisible(false)}
          width={500}
        >
          <Form form={passwordForm} layout="vertical">
            <div className="mb-4 p-3 bg-gray-50 rounded">
              <p className="text-sm text-gray-600">
                即将为管理员 <span className="font-semibold">{selectedAdmin?.name}</span> 重置密码
              </p>
            </div>
            <Form.Item label="新密码" name="newPassword" rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码长度至少6位' }]}>
              <Input.Password placeholder="请输入新密码" />
            </Form.Item>
            <Form.Item label="确认密码" name="confirmPassword" dependencies={['newPassword']} rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}>
              <Input.Password placeholder="请确认新密码" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
