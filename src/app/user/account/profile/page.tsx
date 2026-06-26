'use client';

import { useState } from 'react';
import { Card, Row, Col, Button, Form, Input, Avatar, Upload, Space, Divider, Statistic, Tag, Alert, Modal } from 'antd';
import { UserOutlined, CameraOutlined, SaveOutlined, EditOutlined } from '@ant-design/icons';
import UserLayout from '@/components/user/UserLayout';

export default function UserAccountProfile() {
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  const userInfo = {
    username: 'web3_user_001',
    email: 'user@example.com',
    phone: '+86 138****8888',
    uid: 'U1234567890',
    registerTime: '2024-01-15',
    lastLogin: '2026-05-13 10:30:00',
    level: 'VIP 2',
    inviteCode: 'GXT8888',
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      Modal.success({
        title: '保存成功',
        content: '个人信息已更新',
        onOk: () => setIsEditing(false),
      });
    });
  };

  const handleAvatarChange = (info: any) => {
    if (info.file.status === 'done') {
      setAvatarUrl(URL.createObjectURL(info.file.originFileObj));
    }
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold m-0">个人资料</h1>
          <Button
            type={isEditing ? 'primary' : 'default'}
            icon={isEditing ? <SaveOutlined /> : <EditOutlined />}
            onClick={isEditing ? handleSave : () => setIsEditing(true)}
          >
            {isEditing ? '保存' : '编辑'}
          </Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card>
              <div className="text-center">
                <div className="relative inline-block mb-4">
                  <Avatar
                    size={120}
                    icon={<UserOutlined />}
                    src={avatarUrl}
                    className="border-4 border-gray-100"
                  />
                  {isEditing && (
                    <Upload
                      showUploadList={false}
                      onChange={handleAvatarChange}
                      accept="image/*"
                    >
                      <div className="absolute bottom-0 right-0 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white cursor-pointer">
                        <CameraOutlined />
                      </div>
                    </Upload>
                  )}
                </div>
                <h2 className="text-xl font-bold mb-2">{userInfo.username}</h2>
                <Space direction="vertical" size="small">
                  <Tag color="blue">{userInfo.level}</Tag>
                  <div className="text-gray-500 text-sm">UID: {userInfo.uid}</div>
                </Space>
              </div>
            </Card>

            <Card title="账户统计" className="mt-4">
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <Statistic title="注册时间" value={userInfo.registerTime} valueStyle={{ fontSize: '14px' }} />
                </Col>
                <Col span={12}>
                  <Statistic title="最后登录" value={userInfo.lastLogin} valueStyle={{ fontSize: '14px' }} />
                </Col>
              </Row>
            </Card>
          </Col>

          <Col xs={24} lg={16}>
            <Card title="基本信息">
              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  username: userInfo.username,
                  email: userInfo.email,
                  phone: userInfo.phone,
                }}
                disabled={!isEditing}
              >
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="用户名"
                      name="username"
                      rules={[{ required: true, message: '请输入用户名' }]}
                    >
                      <Input placeholder="请输入用户名" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="邮箱"
                      name="email"
                      rules={[
                        { required: true, message: '请输入邮箱' },
                        { type: 'email', message: '邮箱格式不正确' },
                      ]}
                    >
                      <Input placeholder="请输入邮箱" prefix={<UserOutlined />} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="手机号" name="phone">
                      <Input placeholder="请输入手机号" disabled />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item label="昵称" name="nickname">
                      <Input placeholder="请输入昵称" />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item label="个人简介" name="bio">
                      <Input.TextArea placeholder="介绍一下自己..." rows={4} />
                    </Form.Item>
                  </Col>
                </Row>
              </Form>
            </Card>

            <Card title="邀请信息" className="mt-4">
              <Alert
                message="您的专属邀请码"
                description={
                  <div className="mt-2">
                    <div className="text-2xl font-bold text-blue-600 mb-2">{userInfo.inviteCode}</div>
                    <Space>
                      <Button type="primary">复制邀请码</Button>
                      <Button>邀请海报</Button>
                      <Button>分享链接</Button>
                    </Space>
                  </div>
                }
                type="info"
                showIcon
              />
              <Divider />
              <Row gutter={[16, 16]}>
                <Col span={8}>
                  <Statistic title="已邀请" value={25} suffix="人" />
                </Col>
                <Col span={8}>
                  <Statistic title="活跃用户" value={18} suffix="人" />
                </Col>
                <Col span={8}>
                  <Statistic title="累计奖励" value={1250.5} suffix="GXT" precision={2} />
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>
      </div>
    </UserLayout>
  );
}
