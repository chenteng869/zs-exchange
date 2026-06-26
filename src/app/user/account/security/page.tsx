'use client';

import { useState } from 'react';
import { Card, Row, Col, Button, Switch, Form, Input, Alert, Modal, Space, Tag, Typography, Timeline } from 'antd';
import { LockOutlined, SecurityScanOutlined, SafetyOutlined, SafetyCertificateOutlined, MobileOutlined, MailOutlined, EyeOutlined } from '@ant-design/icons';
import UserLayout from '@/components/user/UserLayout';

const { Title, Text } = Typography;

export default function UserAccountSecurity() {
  const [isPasswordModalVisible, setIsPasswordModalVisible] = useState(false);
  const [is2FAModalVisible, setIs2FAModalVisible] = useState(false);
  const [isWithdrawConfirm, setIsWithdrawConfirm] = useState(true);
  const [isLoginNotify, setIsLoginNotify] = useState(true);
  const [passwordForm] = Form.useForm();

  const securityFeatures = [
    {
      title: '登录密码',
      description: '用于账户登录和敏感操作验证',
      status: 'enabled',
      icon: <LockOutlined />,
      color: '#52c41a',
    },
    {
      title: '两步验证 (2FA)',
      description: '使用Google Authenticator增强账户安全',
      status: 'disabled',
      icon: <SafetyCertificateOutlined />,
      color: '#faad14',
    },
    {
      title: '邮箱验证',
      description: '用于接收安全通知和验证',
      status: 'enabled',
      icon: <MailOutlined />,
      color: '#52c41a',
    },
    {
      title: '手机验证',
      description: '用于接收短信验证码',
      status: 'disabled',
      icon: <MobileOutlined />,
      color: '#faad14',
    },
  ];

  const recentActivities = [
    {
      time: '2026-05-13 10:30:00',
      action: '登录成功',
      ip: '192.168.1.100',
      location: '中国 北京',
      device: 'Chrome / Windows',
      status: 'success',
    },
    {
      time: '2026-05-13 09:15:00',
      action: '修改密码',
      ip: '192.168.1.100',
      location: '中国 北京',
      device: 'Chrome / Windows',
      status: 'success',
    },
    {
      time: '2026-05-12 18:45:00',
      action: '提现申请',
      ip: '192.168.1.100',
      location: '中国 北京',
      device: 'Chrome / Windows',
      status: 'success',
    },
    {
      time: '2026-05-12 15:20:00',
      action: '登录失败',
      ip: '10.0.0.50',
      location: '未知',
      device: 'Firefox / macOS',
      status: 'warning',
    },
  ];

  const handleChangePassword = () => {
    passwordForm.validateFields().then(values => {
      Modal.success({
        title: '密码修改成功',
        content: '请使用新密码重新登录',
        onOk: () => {
          setIsPasswordModalVisible(false);
          passwordForm.resetFields();
        },
      });
    });
  };

  const handleEnable2FA = () => {
    setIs2FAModalVisible(false);
    Modal.success({
      title: '2FA 已启用',
      content: '两步验证已成功启用，下次登录需要输入验证码',
    });
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold m-0">安全设置</h1>

        <Alert
          message="安全提示"
          description="请启用多种安全验证方式，保护您的资产安全"
          type="info"
          showIcon
          icon={<SecurityScanOutlined />}
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="安全功能">
              <div className="space-y-4">
                {securityFeatures.map((feature, index) => (
                  <Card key={index} className="hover:shadow-md transition-shadow">
                    <Row align="middle" justify="space-between">
                      <Col>
                        <Space>
                          <div
                            className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                            style={{ backgroundColor: `${feature.color}20`, color: feature.color }}
                          >
                            {feature.icon}
                          </div>
                          <div>
                            <div className="font-semibold">{feature.title}</div>
                            <div className="text-sm text-gray-500">{feature.description}</div>
                          </div>
                        </Space>
                      </Col>
                      <Col>
                        <Space>
                          <Tag color={feature.status === 'enabled' ? 'green' : 'default'}>
                            {feature.status === 'enabled' ? '已启用' : '未启用'}
                          </Tag>
                          <Button
                            type={feature.status === 'enabled' ? 'default' : 'primary'}
                            onClick={() => {
                              if (feature.title.includes('密码')) setIsPasswordModalVisible(true);
                              if (feature.title.includes('2FA')) setIs2FAModalVisible(true);
                            }}
                          >
                            {feature.status === 'enabled' ? '修改' : '启用'}
                          </Button>
                        </Space>
                      </Col>
                    </Row>
                  </Card>
                ))}
              </div>
            </Card>

            <Card title="安全通知设置" className="mt-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <div>
                    <div className="font-semibold">提现确认</div>
                    <div className="text-sm text-gray-500">提币时需要二次确认</div>
                  </div>
                  <Switch checked={isWithdrawConfirm} onChange={setIsWithdrawConfirm} />
                </div>
                <div className="flex justify-between items-center py-3">
                  <div>
                    <div className="font-semibold">登录通知</div>
                    <div className="text-sm text-gray-500">新设备登录时发送通知</div>
                  </div>
                  <Switch checked={isLoginNotify} onChange={setIsLoginNotify} />
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="安全评分">
              <div className="text-center py-6">
                <div className="text-6xl font-bold text-green-500 mb-2">75</div>
                <div className="text-gray-500 mb-4">安全等级：良好</div>
                <div className="space-y-2">
                  <Alert
                    message="建议启用2FA验证"
                    type="warning"
                    showIcon
                  />
                  <Alert
                    message="建议绑定手机"
                    type="info"
                    showIcon
                  />
                </div>
              </div>
            </Card>

            <Card title="快速操作" className="mt-4">
              <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Button type="primary" block danger>
                  <LockOutlined /> 冻结账户
                </Button>
                <Button block>
                  <SafetyOutlined /> 查看授权
                </Button>
                <Button block>
                  <EyeOutlined /> 活动日志
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>

        <Card title="最近活动">
          <Timeline>
            {recentActivities.map((activity, index) => (
              <Timeline.Item
                key={index}
                color={activity.status === 'success' ? 'green' : activity.status === 'warning' ? 'orange' : 'blue'}
              >
                <div>
                  <div className="font-semibold">{activity.action}</div>
                  <div className="text-sm text-gray-500">
                    <Space>
                      <span>{activity.time}</span>
                      <span>•</span>
                      <span>{activity.ip}</span>
                      <span>•</span>
                      <span>{activity.location}</span>
                      <span>•</span>
                      <span>{activity.device}</span>
                    </Space>
                  </div>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        </Card>

        <Modal
          title="修改登录密码"
          open={isPasswordModalVisible}
          onOk={handleChangePassword}
          onCancel={() => setIsPasswordModalVisible(false)}
          okText="确认修改"
          cancelText="取消"
        >
          <Form form={passwordForm} layout="vertical">
            <Form.Item
              label="当前密码"
              name="currentPassword"
              rules={[{ required: true, message: '请输入当前密码' }]}
            >
              <Input.Password placeholder="请输入当前密码" />
            </Form.Item>
            <Form.Item
              label="新密码"
              name="newPassword"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 8, message: '密码长度至少8位' },
              ]}
            >
              <Input.Password placeholder="请输入新密码（至少8位，包含字母和数字）" />
            </Form.Item>
            <Form.Item
              label="确认新密码"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  },
                }),
              ]}
            >
              <Input.Password placeholder="请再次输入新密码" />
            </Form.Item>
          </Form>
        </Modal>

        <Modal
          title="启用两步验证 (2FA)"
          open={is2FAModalVisible}
          onOk={handleEnable2FA}
          onCancel={() => setIs2FAModalVisible(false)}
          okText="完成启用"
          cancelText="取消"
          width={500}
        >
          <div className="text-center space-y-4">
            <div className="bg-gray-100 w-48 h-48 mx-auto rounded-lg flex items-center justify-center">
              <span className="text-gray-400">二维码区域</span>
            </div>
            <div>
              <Text strong>步骤1：</Text>
              <Text>下载 Google Authenticator 应用</Text>
            </div>
            <div>
              <Text strong>步骤2：</Text>
              <Text>扫描二维码或手动输入密钥</Text>
            </div>
            <div>
              <Text strong>步骤3：</Text>
              <Text>输入6位验证码完成绑定</Text>
            </div>
            <Form layout="vertical">
              <Form.Item label="验证码" name="code">
                <Input placeholder="请输入6位验证码" maxLength={6} />
              </Form.Item>
            </Form>
          </div>
        </Modal>
      </div>
    </UserLayout>
  );
}
