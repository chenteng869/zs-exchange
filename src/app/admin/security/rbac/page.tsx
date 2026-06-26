'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Row, Col, Card, Table, Tag, Button, Modal, Form, Input, Select, Switch, Space, message, Popconfirm, Checkbox, Transfer, Badge, Descriptions, Avatar, List, Divider, Statistic } from 'antd';
import {
  TeamOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  UserOutlined,
  LockOutlined,
  SettingOutlined,
  SafetyCertificateOutlined,
  CrownOutlined,
  EyeOutlined,
  SearchOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

// 权限项定义
const PERMISSION_ITEMS = [
  { key: 'security:overview:view', label: '安全总览查看', category: '安全监控' },
  { key: 'security:intrusion:view', label: '入侵检测查看', category: '安全监控' },
  { key: 'security:intrusion:manage', label: '入侵检测管理', category: '安全监控' },
  { key: 'security:firewall:view', label: '防火墙查看', category: '网络防护' },
  { key: 'security:firewall:manage', label: '防火墙管理', category: '网络防护' },
  { key: 'security:vulnerability:view', label: '漏洞扫描查看', category: '安全评估' },
  { key: 'security:vulnerability:manage', label: '漏洞扫描管理', category: '安全评估' },
  { key: 'security:rbac:manage', label: '权限管理', category: '系统管理' },
  { key: 'security:audit:view', label: '审计日志查看', category: '系统管理' },
  { key: 'security:audit:export', label: '审计日志导出', category: '系统管理' },
  { key: 'security:encryption:view', label: '加密管理查看', category: '数据安全' },
  { key: 'security:encryption:manage', label: '加密密钥管理', category: '数据安全' },
  { key: 'security:policy:view', label: '安全策略查看', category: '策略管理' },
  { key: 'security:policy:manage', label: '安全策略编辑', category: '策略管理' },
  { key: 'command:dashboard:view', label: '指挥大屏查看', category: '指挥中心' },
  { key: 'command:incident:manage', label: '应急事件管理', category: '指挥中心' },
  { key: 'user:manage', label: '用户管理', category: '基础管理' },
  { key: 'system:config', label: '系统配置', category: '基础管理' },
];

// 角色接口
interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions: string[];
  userCount: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 用户接口
interface RBACUser {
  id: string;
  username: string;
  email: string;
  avatar?: string;
  roles: string[];
  department: string;
  lastLogin: string;
  status: 'active' | 'inactive';
}

// 模拟角色数据
const mockRoles: Role[] = [
  { id: 'role-001', name: '超级管理员', code: 'super_admin', description: '拥有系统全部权限，可管理所有功能和数据', permissions: PERMISSION_ITEMS.map(p => p.key), userCount: 2, status: 'active', createdAt: '2024-01-01', updatedAt: '2024-06-01' },
  { id: 'role-002', name: '安全管理员', code: 'security_admin', description: '负责安全防御中心的全面管理和配置', permissions: ['security:overview:view', 'security:intrusion:view', 'security:intrusion:manage', 'security:firewall:view', 'security:firewall:manage', 'security:vulnerability:view', 'security:vulnerability:manage', 'security:audit:view', 'security:audit:export'], userCount: 5, status: 'active', createdAt: '2024-01-15', updatedAt: '2024-05-20' },
  { id: 'role-003', name: '安全分析师', code: 'security_analyst', description: '负责安全事件分析和威胁情报研究', permissions: ['security:overview:view', 'security:intrusion:view', 'security:vulnerability:view', 'security:audit:view', 'command:dashboard:view'], userCount: 8, status: 'active', createdAt: '2024-02-01', updatedAt: '2024-05-15' },
  { id: 'role-004', name: '应急响应专员', code: 'incident_responder', description: '负责安全事件的应急处理和响应', permissions: ['security:overview:view', 'security:intrusion:view', 'security:intrusion:manage', 'command:dashboard:view', 'command:incident:manage'], userCount: 4, status: 'active', createdAt: '2024-02-15', updatedAt: '2024-06-05' },
  { id: 'role-005', name: '合规审计员', code: 'compliance_auditor', description: '负责安全合规检查和审计日志审查', permissions: ['security:overview:view', 'security:audit:view', 'security:audit:export', 'security:policy:view'], userCount: 3, status: 'active', createdAt: '2024-03-01', updatedAt: '2024-05-10' },
  { id: 'role-006', name: '运维工程师', code: 'ops_engineer', description: '负责系统运维和基础设施安全', permissions: ['security:firewall:view', 'security:firewall:manage', 'security:encryption:view', 'system:config'], userCount: 6, status: 'active', createdAt: '2024-03-15', updatedAt: '2024-05-25' },
  { id: 'role-007', name: '只读观察员', code: 'readonly_observer', description: '仅拥有查看权限的安全观察角色', permissions: ['security:overview:view', 'command:dashboard:view'], userCount: 12, status: 'active', createdAt: '2024-04-01', updatedAt: '2024-04-01' },
  { id: 'role-008', name: '已停用角色', code: 'deprecated_role', description: '此角色已停用，不再分配给新用户', permissions: [], userCount: 0, status: 'inactive', createdAt: '2024-01-10', updatedAt: '2024-04-15' },
];

// 模拟用户数据
const mockUsers: RBACUser[] = [
  { id: 'usr-001', username: 'admin', email: 'admin@zs.exchange', roles: ['超级管理员'], department: '技术部', lastLogin: '2024-06-08 14:30:00', status: 'active' },
  { id: 'usr-002', username: 'zhang_wei', email: 'zhangwei@zs.exchange', roles: ['安全管理员'], department: '安全部', lastLogin: '2024-06-08 14:15:00', status: 'active' },
  { id: 'usr-003', username: 'li_ming', email: 'liming@zs.exchange', roles: ['安全分析师'], department: '安全部', lastLogin: '2024-06-08 13:45:00', status: 'active' },
  { id: 'usr-004', username: 'wang_fang', email: 'wangfang@zs.exchange', roles: ['应急响应专员'], department: '安全运营组', lastLogin: '2024-06-08 12:30:00', status: 'active' },
  { id: 'usr-005', username: 'zhao_jun', email: 'zhaojun@zs.exchange', roles: ['合规审计员'], department: '合规部', lastLogin: '2024-06-07 17:00:00', status: 'active' },
  { id: 'usr-006', username: 'chen_hui', email: 'chenhui@zs.exchange', roles: ['运维工程师'], department: '运维部', lastLogin: '2024-06-08 10:20:00', status: 'active' },
  { id: 'usr-007', username: 'liu_yang', email: 'liuyang@zs.exchange', roles: ['只读观察员'], department: '管理层', lastLogin: '2024-06-06 09:00:00', status: 'active' },
  { id: 'usr-008', username: 'sun_lei', email: 'sunlei@zs.exchange', roles: ['安全管理员', '应急响应专员'], department: '安全部', lastLogin: '2024-06-08 11:00:00', status: 'inactive' },
];

export default function RBACPage() {
  const queryClient = useQueryClient();
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [permissionModalVisible, setPermissionModalVisible] = useState(false);
  const [userRoleModalVisible, setUserRoleModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [selectedRoleForPerm, setSelectedRoleForPerm] = useState<Role | null>(null);
  const [selectedUserForRole, setSelectedUserForRole] = useState<RBACUser | null>(null);
  const [roleForm] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [activeView, setActiveView] = useState<'roles' | 'users'>('roles');
  const [targetPermissions, setTargetPermissions] = useState<string[]>([]);
  const [targetRoles, setTargetRoles] = useState<string[]>([]);

  // 删除角色
  const deleteRoleMutation = useMutation({
    mutationFn: async (id: string) => {
      await new Promise(r => setTimeout(r, 300));
      return id;
    },
    onSuccess: () => {
      message.success('角色删除成功');
      queryClient.invalidateQueries({ queryKey: ['rbac-data'] });
    },
  });

  // 筛选角色
  const filteredRoles = mockRoles.filter(role =>
    !searchText || role.name.toLowerCase().includes(searchText.toLowerCase()) || role.code.toLowerCase().includes(searchText.toLowerCase())
  );

  // 筛选用户
  const filteredUsers = mockUsers.filter(user =>
    !searchText || user.username.toLowerCase().includes(searchText.toLowerCase()) || user.email.toLowerCase().includes(searchText.toLowerCase())
  );

  // 打开编辑权限弹窗
  const handleEditPermissions = (role: Role) => {
    setSelectedRoleForPerm(role);
    setTargetPermissions(role.permissions);
    setPermissionModalVisible(true);
  };

  // 打开用户角色分配弹窗
  const handleAssignRoles = (user: RBACUser) => {
    setSelectedUserForRole(user);
    setTargetRoles(mockRoles.filter(r => r.status === 'active' && user.roles.includes(r.name)).map(r => r.id));
    setUserRoleModalVisible(true);
  };

  // 角色表格列
  const roleColumns = [
    {
      title: '角色信息',
      key: 'info',
      render: (_: any, record: Role) => (
        <div className="flex items-center gap-3">
          <Avatar className={record.code === 'super_admin' ? 'bg-red-500' : 'bg-blue-500'} icon={<CrownOutlined />} />
          <div>
            <div className="font-semibold">{record.name}</div>
            <div className="text-xs text-gray-400">{record.code}</div>
          </div>
        </div>
      ),
    },
    { title: '描述', dataIndex: 'description', key: 'description', ellipsis: true },
    {
      title: '权限范围',
      key: 'permissions',
      width: 120,
      render: (_: any, record: Role) => (
        <Tag color="blue">{record.permissions.length} 项权限</Tag>
      ),
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 80,
      render: (count: number) => <span className="font-medium">{count} 人</span>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => (
        <Badge status={status === 'active' ? 'success' : 'default'} text={status === 'active' ? '启用' : '停用'} />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: Role) => (
        <Space size="small">
          <Button type="link" size="small" icon={<SettingOutlined />} onClick={() => handleEditPermissions(record)}>权限</Button>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => { setEditingRole(record); roleForm.setFieldsValue(record); setRoleModalVisible(true); }}>编辑</Button>
          {record.code !== 'super_admin' && (
            <Popconfirm title="确定删除该角色？" onConfirm={() => deleteRoleMutation.mutate(record.id)} okText="确定" cancelText="取消">
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // 用户表格列
  const userColumns = [
    {
      title: '用户信息',
      key: 'userInfo',
      render: (_: any, record: RBACUser) => (
        <div className="flex items-center gap-3">
          <Avatar icon={<UserOutlined />} className="bg-purple-500" />
          <div>
            <div className="font-semibold">{record.username}</div>
            <div className="text-xs text-gray-400">{record.email}</div>
          </div>
        </div>
      ),
    },
    { title: '部门', dataIndex: 'department', key: 'department' },
    {
      title: '角色',
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: string[]) => (
        <Space size={[0, 4]} wrap>
          {roles.map(role => <Tag key={role} color={role === '超级管理员' ? 'red' : 'blue'}>{role}</Tag>)}
        </Space>
      ),
    },
    { title: '最后登录', dataIndex: 'lastLogin', key: 'lastLogin', width: 160 },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => <Badge status={status === 'active' ? 'success' : 'default'} text={status === 'active' ? '活跃' : '停用'} />,
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, record: RBACUser) => (
        <Button type="link" size="small" icon={<TeamOutlined />} onClick={() => handleAssignRoles(record)}>分配角色</Button>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3 mb-6">
          <LockOutlined className="text-2xl text-blue-600" />
          <h1 className="text-2xl font-bold m-0">访问控制管理 (RBAC)</h1>
        </div>

        {/* 统计概览 */}
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={6}>
            <Card size="small" className="shadow-sm"><Statistic title="角色总数" value={mockRoles.length} prefix={<TeamOutlined />} /></Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="shadow-sm"><Statistic title="启用角色" value={mockRoles.filter(r => r.status === 'active').length} valueStyle={{ color: '#16A34A' }} /></Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="shadow-sm"><Statistic title="总用户数" value={mockUsers.length} prefix={<UserOutlined />} /></Card>
          </Col>
          <Col xs={12} sm={6}>
            <Card size="small" className="shadow-sm"><Statistic title="权限项总数" value={PERMISSION_ITEMS.length} prefix={<KeyOutlined />} /></Card>
          </Col>
        </Row>

        {/* 主内容区 */}
        <Card className="shadow-sm" extra={
          <Space>
            <Input.Search
              placeholder="搜索..."
              allowClear
              style={{ width: 220 }}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              enterButton={<SearchOutlined />}
            />
            <Button.Group>
              <Button type={activeView === 'roles' ? 'primary' : 'default'} onClick={() => setActiveView('roles')}>角色管理</Button>
              <Button type={activeView === 'users' ? 'primary' : 'default'} onClick={() => setActiveView('users')}>用户管理</Button>
            </Button.Group>
            {activeView === 'roles' && <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingRole(null); roleForm.resetFields(); setRoleModalVisible(true); }}>新增角色</Button>}
          </Space>
        }>
          {activeView === 'roles' ? (
            <Table dataSource={filteredRoles} columns={roleColumns} rowKey="id" pagination={{ pageSize: 8, showTotal: (t) => `共${t}个角色` }} size="middle" />
          ) : (
            <Table dataSource={filteredUsers} columns={userColumns} rowKey="id" pagination={{ pageSize: 8, showTotal: (t) => `共${t}位用户` }} size="middle" />
          )}
        </Card>

        {/* 权限矩阵预览 */}
        <Card title="权限矩阵概览" className="shadow-sm" size="small">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border p-2 text-left min-w-[120px]">角色 \ 权限</th>
                  {['安全监控', '网络防护', '安全评估', '系统管理', '数据安全', '策略管理', '指挥中心', '基础管理'].map(cat => (
                    <th key={cat} className="border p-2 text-center min-w-[80px]" colSpan={Math.ceil(PERMISSION_ITEMS.filter(p => p.category === cat).length / 2)}>{cat}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mockRoles.filter(r => r.status === 'active').slice(0, 5).map(role => (
                  <tr key={role.id} className="hover:bg-gray-50">
                    <td className="border p-2 font-medium">{role.name}</td>
                    {['安全监控', '网络防护', '安全评估', '系统管理', '数据安全', '策略管理', '指挥中心', '基础管理'].map(cat => {
                      const catPerms = PERMISSION_ITEMS.filter(p => p.category === cat);
                      const hasAny = catPerms.some(cp => role.permissions.includes(cp.key));
                      const hasAll = catPerms.every(cp => role.permissions.includes(cp.key));
                      return (
                        <td key={`${role.id}-${cat}`} className="border p-2 text-center">
                          {catPerms.length === 0 ? '-' : hasAll ? <Tag color="green" className="m-0">全权</Tag> : hasAny ? <Tag color="blue" className="m-0">部分</Tag> : <Tag className="m-0">无</Tag>}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-right mt-2">
            <Button type="link" size="small" icon={<EyeOutlined />}>查看完整矩阵</Button>
          </div>
        </Card>

        {/* 新增/编辑角色弹窗 */}
        <Modal title={editingRole ? '编辑角色' : '新增角色'} open={roleModalVisible} onCancel={() => setRoleModalVisible(false)} width={550} okText={editingRole ? '更新' : '创建'} onOk={async () => {
          try {
            await roleForm.validateFields();
            await new Promise(r => setTimeout(r, 400));
            message.success(editingRole ? '角色更新成功' : '角色创建成功');
            setRoleModalVisible(false);
            queryClient.invalidateQueries({ queryKey: ['rbac-data'] });
          } catch (e) {}
        }}>
          <Form form={roleForm} layout="vertical" className="mt-4">
            <Form.Item name="name" label="角色名称" rules={[{ required: true }]}>
              <Input placeholder="请输入角色名称" prefix={<TeamOutlined />} />
            </Form.Item>
            <Form.Item name="code" label="角色编码" rules={[{ required: true }]}>
              <Input placeholder="例如: security_admin" prefix={<KeyOutlined />} />
            </Form.Item>
            <Form.Item name="description" label="描述">
              <Input.TextArea rows={3} placeholder="请输入角色描述" />
            </Form.Item>
            <Form.Item name="status" label="状态" initialValue="active">
              <Select options={[{ label: '启用', value: 'active' }, { label: '停用', value: 'inactive' }]} />
            </Form.Item>
          </Form>
        </Modal>

        {/* 权限编辑弹窗 */}
        <Modal title={`编辑权限 - ${selectedRoleForPerm?.name || ''}`} open={permissionModalVisible} onCancel={() => setPermissionModalVisible(false)} width={650} okText="保存" onOk={async () => {
          await new Promise(r => setTimeout(r, 300));
          message.success('权限保存成功');
          setPermissionModalVisible(false);
          queryClient.invalidateQueries({ queryKey: ['rbac-data'] });
        }}>
          <div className="mb-3 text-sm text-gray-500">当前角色: {selectedRoleForPerm?.name} | 已选择 {targetPermissions.length} 项权限</div>
          <Transfer
            dataSource={PERMISSION_ITEMS.map(p => ({ key: p.key, title: p.label, description: p.category }))}
            titles={['可选权限', '已选权限']}
            targetKeys={targetPermissions}
            onChange={(keys) => setTargetPermissions(keys as string[])}
            render={item => item.title}
            listStyle={{ width: 280, height: 360 }}
            showSearch
            filterOption={(inputValue, item) => item.title.toLowerCase().indexOf(inputValue.toLowerCase()) !== -1}
          />
        </Modal>

        {/* 用户角色分配弹窗 */}
        <Modal title={`分配角色 - ${selectedUserForRole?.username || ''}`} open={userRoleModalVisible} onCancel={() => setUserRoleModalVisible(false)} width={550} okText="保存" onOk={async () => {
          await new Promise(r => setTimeout(r, 300));
          message.success('角色分配成功');
          setUserRoleModalVisible(false);
          queryClient.invalidateQueries({ queryKey: ['rbac-data'] });
        }}>
          <Descriptions column={1} size="small" className="mb-4">
            <Descriptions.Item label="用户名">{selectedUserForRole?.username}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{selectedUserForRole?.email}</Descriptions.Item>
            <Descriptions.Item label="部门">{selectedUserForRole?.department}</Descriptions.Item>
          </Descriptions>
          <Transfer
            dataSource={mockRoles.filter(r => r.status === 'active').map(r => ({ key: r.id, title: r.name, description: r.description }))}
            titles={['可选角色', '已分配角色']}
            targetKeys={targetRoles}
            onChange={(keys) => setTargetRoles(keys as string[])}
            render={item => item.title}
            listStyle={{ width: 220, height: 300 }}
          />
        </Modal>

        {/* 安全提示 */}
        <Card className="shadow-sm bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <div className="flex items-start gap-3">
            <SafetyCertificateOutlined className="text-xl text-blue-500 mt-1" />
            <div>
              <h4 className="font-bold text-blue-700 m-0 mb-1">RBAC权限管理规范</h4>
              <p className="text-sm text-blue-600 m-0">
                中萨数字科技交易所采用基于角色的访问控制(RBAC)模型。最小权限原则是核心原则——每个角色仅授予完成工作所需的最小权限集合。
                超级管理员角色需严格限制人数（建议不超过3人），敏感操作必须多人审批。每季度进行一次权限审计清理冗余权限。
              </p>
            </div>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}
