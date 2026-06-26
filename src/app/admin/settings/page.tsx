'use client';

import React, { useState } from 'react';
import {
  Row,
  Col,
  Card,
  Tabs,
  Form,
  Input,
  Switch,
  Select,
  Button,
  Table,
  Tag,
  Space,
  Typography,
  message,
  Divider,
} from 'antd';
import {
  SettingOutlined,
  SafetyCertificateOutlined,
  BellOutlined,
  ApiOutlined,
  KeyOutlined,
  SaveOutlined,
  PlusOutlined,
  DeleteOutlined,
  CopyOutlined,
  GlobalOutlined,
  LockOutlined,
  MailOutlined,
  PhoneOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const mockApiKeys = [
  { id: 'AK-001', name: '交易API主密钥', key: 'sk_live_xxxxxxxxxxxxxxxxxxxx', permissions: ['trade', 'read'], created: '2024-05-15', lastUsed: '2024-06-23 14:20', status: 'active' },
  { id: 'AK-002', name: '行情只读密钥', key: 'sk_read_yyyyyyyyyyyyyyyyyyyy', permissions: ['read'], created: '2024-06-01', lastUsed: '2024-06-23 13:55', status: 'active' },
  { id: 'AK-003', name: '风控系统接口', key: 'sk_risk_zzzzzzzzzzzzzzzzzzzz', permissions: ['read', 'risk'], created: '2024-04-20', lastUsed: '2024-06-22 18:30', status: 'active' },
  { id: 'AK-004', name: '测试环境密钥', key: 'sk_test_aaaaaaaaaaaaaaaaaaaa', permissions: ['trade', 'read', 'admin'], created: '2024-03-10', lastUsed: '2024-06-18 09:12', status: 'revoked' },
  { id: 'AK-005', name: 'Webhook回调密钥', key: 'sk_hook_bbbbbbbbbbbbbbbbbbbb', permissions: ['webhook'], created: '2024-05-28', lastUsed: '2024-06-23 10:45', status: 'active' },
];

export default function SettingsPage() {
  const [basicForm] = Form.useForm();
  const [securityForm] = Form.useForm();
  const [notifyForm] = Form.useForm();
  const [apiForm] = Form.useForm();

  const handleSaveBasic = () => {
    basicForm.validateFields().then((values) => {
      message.success('基础设置保存成功');
    });
  };

  const handleSaveSecurity = () => {
    securityForm.validateFields().then((values) => {
      message.success('安全设置保存成功');
    });
  };

  const handleSaveNotify = () => {
    notifyForm.validateFields().then((values) => {
      message.success('通知配置保存成功');
    });
  };

  const handleSaveApi = () => {
    apiForm.validateFields().then((values) => {
      message.success('API设置保存成功');
    });
  };

  const apiKeyColumns = [
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: 'API Key',
      dataIndex: 'key',
      key: 'key',
      render: (text: string) => (
        <Space>
          <Text code style={{ fontSize: 12 }}>{text}</Text>
          <Button type="text" size="small" icon={<CopyOutlined />} />
        </Space>
      ),
    },
    {
      title: '权限',
      dataIndex: 'permissions',
      key: 'permissions',
      render: (perms: string[]) => (
        <Space size={4}>
          {perms.map((p) => (
            <Tag key={p} color="blue">{p}</Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '创建时间',
      dataIndex: 'created',
      key: 'created',
      width: 110,
    },
    {
      title: '最后使用',
      dataIndex: 'lastUsed',
      key: 'lastUsed',
      width: 130,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: string) =>
        s === 'active' ? (
          <Tag color="success">活跃</Tag>
        ) : (
          <Tag color="error">已吊销</Tag>
        ),
    },
  ];

  const tabItems = [
    {
      key: 'basic',
      label: (
        <span>
          <SettingOutlined /> 基础设置
        </span>
      ),
      children: (
        <div className="space-y-6">
          <Card
            title={<><GlobalOutlined /> 站点基本信息</>}
            style={{ borderRadius: 12 }}
          >
            <Form
              form={basicForm}
              layout="vertical"
              initialValues={{
                siteName: 'AIOPC 数字资产交易所',
                siteUrl: 'https://exchange.aiopc.com',
                maintenanceMode: false,
                language: 'zh-CN',
                timezone: 'Asia/Shanghai',
                contactEmail: 'admin@aiopc.com',
              }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="站点名称" name="siteName">
                    <Input placeholder="输入站点名称" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="站点URL" name="siteUrl">
                    <Input placeholder="https://" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="默认语言" name="language">
                    <Select>
                      <Option value="zh-CN">简体中文</Option>
                      <Option value="en-US">English</Option>
                      <Option value="ja-JP">日本語</Option>
                      <Option value="ko-KR">한국어</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="系统时区" name="timezone">
                    <Select>
                      <Option value="Asia/Shanghai">Asia/Shanghai (UTC+8)</Option>
                      <Option value="Asia/Tokyo">Asia/Tokyo (UTC+9)</Option>
                      <Option value="America/New_York">America/New_York (UTC-5)</Option>
                      <Option value="Europe/London">Europe/London (UTC+0)</Option>
                    </Select>
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="联系邮箱" name="contactEmail">
                    <Input prefix={<MailOutlined />} placeholder="admin@example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="维护模式" name="maintenanceMode" valuePropName="checked">
                    <Switch
                      checkedChildren="开启"
                      unCheckedChildren="关闭"
                    />
                  </Form.Item>
                  <Text type="secondary" className="ml-2" style={{ fontSize: 12 }}>
                    开启后用户将无法访问交易功能
                  </Text>
                </Col>
              </Row>
            </Form>
          </Card>

          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveBasic}
            >
              保存基础设置
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'security',
      label: (
        <span>
          <SafetyCertificateOutlined /> 安全设置
        </span>
      ),
      children: (
        <div className="space-y-6">
          <Card
            title={<><LockOutlined /> 安全策略配置</>}
            style={{ borderRadius: 12 }}
          >
            <Form
              form={securityForm}
              layout="vertical"
              initialValues={{
                maxLoginAttempts: 5,
                lockoutDuration: 30,
                ipWhitelist: '192.168.1.0/24\n10.0.0.0/8\n172.16.0.0/12',
                sessionTimeout: 3600,
                twoFactorAuth: true,
                forceHttps: true,
                passwordMinLength: 12,
              }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="最大登录尝试次数" name="maxLoginAttempts">
                    <Input type="number" suffix="次" min={3} max={10} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="锁定时长(分钟)" name="lockoutDuration">
                    <Input type="number" suffix="分钟" min={5} max={120} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="会话超时(秒)" name="sessionTimeout">
                    <Input type="number" suffix="秒" min={300} max={86400} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="密码最小长度" name="passwordMinLength">
                    <Input type="number" suffix="位" min={8} max={32} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="强制HTTPS" name="forceHttps" valuePropName="checked">
                    <Switch checkedChildren="是" unCheckedChildren="否" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="双因素认证(2FA)" name="twoFactorAuth" valuePropName="checked">
                    <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="IP白名单(每行一个CIDR)" name="ipWhitelist">
                    <TextArea rows={4} placeholder="192.168.1.0/24&#10;10.0.0.0/8" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveSecurity}
            >
              保存安全设置
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'notification',
      label: (
        <span>
          <BellOutlined /> 通知设置
        </span>
      ),
      children: (
        <div className="space-y-6">
          <Card
            title={<><BellOutlined /> 通知渠道配置</>}
            style={{ borderRadius: 12 }}
          >
            <Form
              form={notifyForm}
              layout="vertical"
              initialValues={{
                emailEnabled: true,
                emailSmtpHost: 'smtp.aiopc.com',
                emailSmtpPort: 587,
                emailSender: 'noreply@aiopc.com',
                smsEnabled: false,
                smsProvider: 'aliyun',
                webhookEnabled: true,
                webhookUrl: 'https://hooks.aiopc.com/notify',
                notifyOnTrade: true,
                notifyOnWithdraw: true,
                notifyOnLogin: true,
                notifyOnAlert: true,
              }}
            >
              {/* 邮件通知 */}
              <Divider orientation="left"><MailOutlined /> 邮件通知</Divider>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="启用邮件通知" name="emailEnabled" valuePropName="checked">
                    <Switch checkedChildren="开" unCheckedChildren="关" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="SMTP主机" name="emailSmtpHost">
                    <Input placeholder="smtp.example.com" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="SMTP端口" name="emailSmtpPort">
                    <Input type="number" placeholder="587" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="发件人地址" name="emailSender">
                    <Input placeholder="noreply@example.com" />
                  </Form.Item>
                </Col>
              </Row>

              {/* 短信通知 */}
              <Divider orientation="left"><PhoneOutlined /> 短信通知</Divider>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="启用短信通知" name="smsEnabled" valuePropName="checked">
                    <Switch checkedChildren="开" unCheckedChildren="关" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="短信服务商" name="smsProvider">
                    <Select>
                      <Option value="aliyun">阿里云短信</Option>
                      <Option value="tencent">腾讯云短信</Option>
                      <Option value="twilio">Twilio</Option>
                    </Select>
                  </Form.Item>
                </Col>
              </Row>

              {/* Webhook通知 */}
              <Divider orientation="left"><LinkOutlined /> Webhook通知</Divider>
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="启用Webhook" name="webhookEnabled" valuePropName="checked">
                    <Switch checkedChildren="开" unCheckedChildren="关" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="Webhook URL" name="webhookUrl">
                    <Input placeholder="https://hooks.example.com/notify" />
                  </Form.Item>
                </Col>
              </Row>

              {/* 通知触发事件 */}
              <Divider>通知触发事件</Divider>
              <Row gutter={[16, 16]}>
                <Col span={6}>
                  <Form.Item label="交易通知" name="notifyOnTrade" valuePropName="checked">
                    <Switch size="small" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="提现通知" name="notifyOnWithdraw" valuePropName="checked">
                    <Switch size="small" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="登录通知" name="notifyOnLogin" valuePropName="checked">
                    <Switch size="small" />
                  </Form.Item>
                </Col>
                <Col span={6}>
                  <Form.Item label="告警通知" name="notifyOnAlert" valuePropName="checked">
                    <Switch size="small" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveNotify}
            >
              保存通知设置
            </Button>
          </div>
        </div>
      ),
    },
    {
      key: 'api',
      label: (
        <span>
          <ApiOutlined /> API设置
        </span>
      ),
      children: (
        <div className="space-y-6">
          <Card
            title={<><KeyOutlined /> API访问控制</>}
            style={{ borderRadius: 12 }}
          >
            <Form
              form={apiForm}
              layout="vertical"
              initialValues={{
                rateLimit: 1000,
                rateLimitWindow: 60,
                corsOrigins: 'https://app.aiopc.com\nhttps://admin.aiopc.com',
                enableApiKey: true,
                ipRateLimit: 100,
              }}
            >
              <Row gutter={24}>
                <Col span={12}>
                  <Form.Item label="Rate Limit(请求/分钟)" name="rateLimit">
                    <Input type="number" suffix="req/min" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="限流窗口(秒)" name="rateLimitWindow">
                    <Input type="number" suffix="秒" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="单IP限制(请求/分钟)" name="ipRateLimit">
                    <Input type="number" suffix="req/min/IP" />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item label="启用API Key认证" name="enableApiKey" valuePropName="checked">
                    <Switch checkedChildren="开" unCheckedChildren="关" />
                  </Form.Item>
                </Col>
                <Col span={24}>
                  <Form.Item label="CORS允许来源(每行一个)" name="corsOrigins">
                    <TextArea rows={3} placeholder="https://app.example.com" />
                  </Form.Item>
                </Col>
              </Row>
            </Form>
          </Card>

          {/* API Key管理表格 */}
          <Card
            title={<><KeyOutlined /> API密钥管理</>}
            extra={
              <Button type="primary" size="small" icon={<PlusOutlined />}>
                创建新密钥
              </Button>
            }
            style={{ borderRadius: 12 }}
          >
            <Table
              columns={apiKeyColumns}
              dataSource={mockApiKeys}
              rowKey="id"
              pagination={false}
              size="middle"
            />
          </Card>

          <div className="flex justify-end">
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSaveApi}
            >
              保存API设置
            </Button>
          </div>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 标题区 */}
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: '#0F1B3D' }}
          >
            <SettingOutlined style={{ color: '#F0B90B' }} />
            全局设置与配置中心
          </h1>
          <p className="text-gray-500 mt-2">
            系统参数 · 安全策略 · 通知配置 · API密钥 · 功能开关
          </p>
        </div>

        {/* 分区设置Tab */}
        <Card bordered={false} style={{ borderRadius: 12 }}>
          <Tabs
            defaultActiveKey="basic"
            type="card"
            items={tabItems}
            size="large"
          />
        </Card>
      </div>
    </AdminLayout>
  );
}
