/**
 * 角色与权限管理页面
 */

'use client';

import React, { useState, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Modal,
  Form,
  Input,
  Tree,
  message,
  Popconfirm,
  Badge,
  Switch,
  Descriptions,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import {
  getAllRoles,
  getRoleById,
  createRole,
  updateRole,
  deleteRole,
  getPermissionTree,
  getAllAdmins,
  type Role,
} from '@/lib/admin/rbac';

const { TextArea } = Input;

export default function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>(getAllRoles());
  const [createModal, setCreateModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [detailModal, setDetailModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const permissionTree = useMemo(() => getPermissionTree(), []);

  const refreshRoles = () => {
    setRoles(getAllRoles());
  };

  const handleCreate = async (values: any) => {
    try {
      const permissions = (values.permissions || []).filter(
        (p: string) => p.includes(':')
      );
      createRole({
        name: values.name,
        description: values.description,
        permissions,
      });
      message.success('角色创建成功');
      setCreateModal(false);
      form.resetFields();
      refreshRoles();
    } catch (e: any) {
      message.error(e.message || '创建失败');
    }
  };

  const handleEdit = async (values: any) => {
    if (!selectedRole) return;
    try {
      const permissions = (values.permissions || []).filter(
        (p: string) => p.includes(':')
      );
      updateRole(selectedRole.id, {
        name: values.name,
        description: values.description,
        permissions,
        status: values.status ? 'active' : 'disabled',
      });
      message.success('角色更新成功');
      setEditModal(false);
      refreshRoles();
    } catch (e: any) {
      message.error(e.message || '更新失败');
    }
  };

  const handleDelete = (id: string) => {
    const success = deleteRole(id);
    if (success) {
      message.success('角色删除成功');
      refreshRoles();
    } else {
      message.error('删除失败：角色下仍有用户');
    }
  };

  const handleViewDetail = (role: Role) => {
    setSelectedRole(role);
    setDetailModal(true);
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    editForm.setFieldsValue({
      name: role.name,
      description: role.description,
      permissions: role.permissions,
      status: role.status === 'active',
    });
    setEditModal(true);
  };

  const columns = [
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
      width: 180,
      render: (val: string) => <strong>{val}</strong>,
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
    },
    {
      title: '权限数',
      key: 'permCount',
      width: 100,
      render: (_: any, record: Role) => (
        <Tag color="blue">{record.permissions.length} 个</Tag>
      ),
    },
    {
      title: '用户数',
      dataIndex: 'userCount',
      key: 'userCount',
      width: 100,
      render: (val: number) => (
        <span>
          <UserOutlined style={{ marginRight: 4 }} />
          {val}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (val: string) =>
        val === 'active' ? (
          <Badge status="success" text="启用" />
        ) : val === 'disabled' ? (
          <Badge status="default" text="禁用" />
        ) : (
          <Badge status="warning" text="维护中" />
        ),
    },
    {
      title: '创建时间',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: any, record: Role) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetail(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEditRole(record)}
          >
            编辑
          </Button>
          {record.name !== '超级管理员' && (
            <Popconfirm
              title="确认删除角色"
              description="删除后无法恢复，确定要删除吗？"
              onConfirm={() => handleDelete(record.id)}
              okText="删除"
              cancelText="取消"
              okButtonProps={{ danger: true }}
            >
              <Button type="link" danger size="small" icon={<DeleteOutlined />}>
                删除
              </Button>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card
        title="角色管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModal(true)}>
            新建角色
          </Button>
        }
      >
        <Table
          columns={columns}
          dataSource={roles}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => `共 ${total} 个角色`,
          }}
          size="middle"
        />
      </Card>

      <Modal
        title="新建角色"
        open={createModal}
        onCancel={() => setCreateModal(false)}
        footer={null}
        width={700}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" maxLength={50} />
          </Form.Item>
          <Form.Item
            name="description"
            label="角色描述"
            rules={[{ required: true, message: '请输入角色描述' }]}
          >
            <TextArea rows={2} placeholder="请输入角色描述" maxLength={200} />
          </Form.Item>
          <Form.Item
            name="permissions"
            label="权限配置"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Tree
              checkable
              defaultExpandAll
              treeData={permissionTree}
              fieldNames={{ title: 'title', key: 'key', children: 'children' }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCreateModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                创建角色
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="编辑角色"
        open={editModal}
        onCancel={() => setEditModal(false)}
        footer={null}
        width={700}
      >
        <Form form={editForm} layout="vertical" onFinish={handleEdit}>
          <Form.Item
            name="name"
            label="角色名称"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" maxLength={50} />
          </Form.Item>
          <Form.Item
            name="description"
            label="角色描述"
            rules={[{ required: true, message: '请输入角色描述' }]}
          >
            <TextArea rows={2} placeholder="请输入角色描述" maxLength={200} />
          </Form.Item>
          <Form.Item name="status" label="启用状态" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item
            name="permissions"
            label="权限配置"
            rules={[{ required: true, message: '请选择权限' }]}
          >
            <Tree
              checkable
              defaultExpandAll
              treeData={permissionTree}
              fieldNames={{ title: 'title', key: 'key', children: 'children' }}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setEditModal(false)}>取消</Button>
              <Button type="primary" htmlType="submit">
                保存修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="角色详情"
        open={detailModal}
        onCancel={() => setDetailModal(false)}
        width={600}
        footer={[
          <Button key="close" onClick={() => setDetailModal(false)}>
            关闭
          </Button>,
        ]}
      >
        {selectedRole && (
          <div>
            <Descriptions column={2} bordered size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label="角色名称" span={2}>
                <strong>{selectedRole.name}</strong>
              </Descriptions.Item>
              <Descriptions.Item label="描述" span={2}>
                {selectedRole.description}
              </Descriptions.Item>
              <Descriptions.Item label="权限数量">
                {selectedRole.permissions.length} 个
              </Descriptions.Item>
              <Descriptions.Item label="用户数量">
                {selectedRole.userCount} 人
              </Descriptions.Item>
              <Descriptions.Item label="状态">
                {selectedRole.status === 'active' ? (
                  <Badge status="success" text="启用" />
                ) : (
                  <Badge status="default" text="禁用" />
                )}
              </Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {dayjs(selectedRole.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            </Descriptions>

            <div>
              <h4 style={{ marginBottom: 12 }}>权限列表</h4>
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {permissionTree.map((module) => (
                  <div key={module.key} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 500, marginBottom: 4 }}>
                      {module.title}
                    </div>
                    <Space wrap size={[4, 4]}>
                      {module.children.map((perm: any) => (
                        <Tag
                          key={perm.key}
                          color={
                            selectedRole.permissions.includes(perm.key)
                              ? 'blue'
                              : 'default'
                          }
                        >
                          {perm.title}
                        </Tag>
                      ))}
                    </Space>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
