'use client';

import { useState } from 'react';
import { Card, Row, Col, Statistic, Form, Input, Switch, Button, Select, InputNumber, Tabs, message, Divider, Tag, Badge, Descriptions, Alert } from 'antd';
import { SettingOutlined, SafetyCertificateOutlined, GlobalOutlined, MailOutlined, MessageOutlined, CloudUploadOutlined, SaveOutlined, CheckCircleOutlined, ClockCircleOutlined, DatabaseOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;
const { TabPane } = Tabs;

// 模拟系统状态数据
const systemStatus = {
  uptime: '72天 15小时 32分钟',
  configCount: 128,
  todayOperations: 342,
  cpuUsage: 45,
  memoryUsage: 68,
  diskUsage: 52,
};

// 系统操作趋势图表配置
const operationTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['登录次数', '配置修改', 'API调用'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
  yAxis: { type: 'value' },
  series: [
    { type: 'line', smooth: true, data: [20, 15, 45, 80, 95, 60, 30], name: '登录次数', itemStyle: { color: '#1677FF' } },
    { type: 'line', smooth: true, data: [5, 3, 12, 25, 30, 18, 8], name: '配置修改', itemStyle: { color: '#16A34A' } },
    { type: 'line', smooth: true, data: [100, 80, 200, 350, 420, 280, 150], name: 'API调用', itemStyle: { color: '#7C3AED' } },
  ],
};

// 资源使用图表配置
const resourceUsageOption = {
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left' },
  series: [
    {
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2,
      },
      label: { show: false, position: 'center' },
      emphasis: { label: { show: true, fontSize: 20, fontWeight: 'bold' } },
      labelLine: { show: false },
      data: [
        { value: systemStatus.cpuUsage, name: 'CPU使用率', itemStyle: { color: '#1677FF' } },
        { value: systemStatus.memoryUsage, name: '内存使用率', itemStyle: { color: '#16A34A' } },
        { value: systemStatus.diskUsage, name: '磁盘使用率', itemStyle: { color: '#F59E0B' } },
      ],
    },
  ],
};

export default function SystemConfigPage() {
  const [securityForm] = Form.useForm();
  const [systemForm] = Form.useForm();
  const [emailForm] = Form.useForm();
  const [smsForm] = Form.useForm();
  const [storageForm] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // 初始化表单数据
  const initialSecurityData = {
    twoFactorAuth: true,
    ipWhitelist: false,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    apiRateLimit: 1000,
    apiKeyRotation: 90,
    passwordMinLength: 8,
    passwordRequireNumber: true,
    passwordRequireSpecial: true,
    passwordExpiry: 90,
  };

  const initialSystemData = {
    systemName: 'GXT Web3 Platform',
    maintenanceMode: false,
    globalNotification: '欢迎使用GXT平台！',
    timezone: 'Asia/Shanghai',
    language: 'zh-CN',
  };

  const initialEmailData = {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@gxt.com',
    smtpFrom: 'GXT Platform <noreply@gxt.com>',
    enableTLS: true,
  };

  const initialSmsData = {
    provider: 'aliyun',
    accessKeyId: 'LTAI5t7...',
    accessKeySecret: '********',
    signName: 'GXT平台',
    templateCode: 'SMS_123456789',
  };

  const initialStorageData = {
    provider: 'oss',
    accessKeyId: 'LTAI5t8...',
    accessKeySecret: '********',
    bucket: 'gxt-files',
    region: 'cn-hangzhou',
    domain: 'https://files.gxt.com',
  };

  const handleSave = (formName: string, form: any) => {
    setLoading(true);
    form.validateFields().then((values: any) => {
      setTimeout(() => {
        message.success(`${formName}配置保存成功！`);
        setLoading(false);
      }, 1000);
    }).catch(() => {
      setLoading(false);
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <SettingOutlined className="text-2xl text-blue-600" />
          <h1 className="text-2xl font-bold m-0">系统配置</h1>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="系统状态"
                value={1}
                formatter={() => (
                  <Badge status="success" text="正常运行" />
                )}
                valueStyle={{ color: '#16A34A' }}
                prefix={<CheckCircleOutlined />}
              />
              <div className="text-gray-400 text-sm mt-2 flex items-center gap-1">
                <ClockCircleOutlined /> 运行时间: {systemStatus.uptime}
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="配置项总数"
                value={systemStatus.configCount}
                valueStyle={{ color: '#1677FF' }}
                prefix={<DatabaseOutlined />}
              />
              <div className="text-gray-400 text-sm mt-2">
                系统配置参数数量
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="运行时长"
                value={72}
                suffix="天"
                valueStyle={{ color: '#7C3AED' }}
              />
              <div className="text-gray-400 text-sm mt-2">
                自上次重启以来
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="今日操作次数"
                value={systemStatus.todayOperations}
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="text-gray-400 text-sm mt-2">
                配置修改记录
              </div>
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title="今日操作趋势">
              <SafeECharts option={operationTrendOption} style={{ height: 280 }} title="今日操作趋势" />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="资源使用情况">
              <SafeECharts option={resourceUsageOption} style={{ height: 280 }} title="资源使用情况" />
            </Card>
          </Col>
        </Row>

        {/* 配置标签页 */}
        <Card>
          <Tabs defaultActiveKey="1" type="card">
            {/* 安全配置 */}
            <TabPane tab={<span><SafetyCertificateOutlined /> 安全配置</span>} key="1">
              <Form
                form={securityForm}
                layout="vertical"
                initialValues={initialSecurityData}
              >
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Card size="small" title="登录安全" className="mb-4">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="双因素认证">
                          <Form.Item name="twoFactorAuth" valuePropName="checked" noStyle>
                            <Switch />
                          </Form.Item>
                        </Descriptions.Item>
                        <Descriptions.Item label="IP白名单">
                          <Form.Item name="ipWhitelist" valuePropName="checked" noStyle>
                            <Switch />
                          </Form.Item>
                        </Descriptions.Item>
                        <Descriptions.Item label="会话超时(分钟)">
                          <Form.Item name="sessionTimeout" noStyle>
                            <InputNumber min={5} max={1440} style={{ width: '100%' }} />
                          </Form.Item>
                        </Descriptions.Item>
                        <Descriptions.Item label="最大登录尝试次数">
                          <Form.Item name="maxLoginAttempts" noStyle>
                            <InputNumber min={3} max={20} style={{ width: '100%' }} />
                          </Form.Item>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                  <Col xs={24} md={12}>
                    <Card size="small" title="API安全" className="mb-4">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="API限流(次/分钟)">
                          <Form.Item name="apiRateLimit" noStyle>
                            <InputNumber min={100} max={10000} style={{ width: '100%' }} />
                          </Form.Item>
                        </Descriptions.Item>
                        <Descriptions.Item label="API密钥轮换(天)">
                          <Form.Item name="apiKeyRotation" noStyle>
                            <InputNumber min={30} max={365} style={{ width: '100%' }} />
                          </Form.Item>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                    <Card size="small" title="密码策略">
                      <Descriptions column={1} size="small">
                        <Descriptions.Item label="密码最小长度">
                          <Form.Item name="passwordMinLength" noStyle>
                            <InputNumber min={6} max={32} style={{ width: '100%' }} />
                          </Form.Item>
                        </Descriptions.Item>
                        <Descriptions.Item label="必须包含数字">
                          <Form.Item name="passwordRequireNumber" valuePropName="checked" noStyle>
                            <Switch />
                          </Form.Item>
                        </Descriptions.Item>
                        <Descriptions.Item label="必须包含特殊字符">
                          <Form.Item name="passwordRequireSpecial" valuePropName="checked" noStyle>
                            <Switch />
                          </Form.Item>
                        </Descriptions.Item>
                        <Descriptions.Item label="密码过期(天)">
                          <Form.Item name="passwordExpiry" noStyle>
                            <InputNumber min={0} max={365} style={{ width: '100%' }} />
                          </Form.Item>
                        </Descriptions.Item>
                      </Descriptions>
                    </Card>
                  </Col>
                </Row>
                <Divider />
                <div className="flex justify-end">
                  <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => handleSave('安全', securityForm)}>
                    保存安全配置
                  </Button>
                </div>
              </Form>
            </TabPane>

            {/* 系统参数 */}
            <TabPane tab={<span><GlobalOutlined /> 系统参数</span>} key="2">
              <Form
                form={systemForm}
                layout="vertical"
                initialValues={initialSystemData}
              >
                <Card size="small" title="基础设置" className="mb-4">
                  <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                      <Form.Item label="系统名称" name="systemName" rules={[{ required: true, message: '请输入系统名称' }]}>
                        <Input placeholder="请输入系统名称" />
                      </Form.Item>
                      <Form.Item label="时区" name="timezone">
                        <Select>
                          <Option value="Asia/Shanghai">亚洲/上海 (UTC+8)</Option>
                          <Option value="Asia/Tokyo">亚洲/东京 (UTC+9)</Option>
                          <Option value="America/New_York">美洲/纽约 (UTC-5)</Option>
                          <Option value="Europe/London">欧洲/伦敦 (UTC+0)</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="语言" name="language">
                        <Select>
                          <Option value="zh-CN">简体中文</Option>
                          <Option value="en-US">English</Option>
                          <Option value="ja-JP">日本語</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item label="维护模式" name="maintenanceMode" valuePropName="checked">
                        <Switch checkedChildren="开启" unCheckedChildren="关闭" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Card size="small" title="全局通知">
                  <Form.Item label="全局公告" name="globalNotification">
                    <Input.TextArea rows={4} placeholder="输入全局公告内容..." />
                  </Form.Item>
                  <Alert message="提示" description="维护模式开启后，普通用户将无法访问系统，仅管理员可登录。" type="info" showIcon />
                </Card>

                <Divider />
                <div className="flex justify-end">
                  <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => handleSave('系统', systemForm)}>
                    保存系统配置
                  </Button>
                </div>
              </Form>
            </TabPane>

            {/* 邮件服务 */}
            <TabPane tab={<span><MailOutlined /> 邮件服务</span>} key="3">
              <Form
                form={emailForm}
                layout="vertical"
                initialValues={initialEmailData}
              >
                <Card size="small" title="SMTP配置">
                  <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                      <Form.Item label="SMTP服务器" name="smtpHost" rules={[{ required: true, message: '请输入SMTP服务器地址' }]}>
                        <Input placeholder="例如: smtp.gmail.com" />
                      </Form.Item>
                      <Form.Item label="端口" name="smtpPort" rules={[{ required: true, message: '请输入端口号' }]}>
                        <InputNumber min={1} max={65535} style={{ width: '100%' }} />
                      </Form.Item>
                      <Form.Item label="SMTP用户名" name="smtpUser" rules={[{ required: true, message: '请输入SMTP用户名' }]}>
                        <Input placeholder="邮箱用户名" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="发件人显示" name="smtpFrom" rules={[{ required: true, message: '请输入发件人显示名称' }]}>
                        <Input placeholder="例如: GXT Platform <noreply@gxt.com>" />
                      </Form.Item>
                      <Form.Item label="SMTP密码" name="smtpPassword">
                        <Input.Password placeholder="请输入SMTP密码" />
                      </Form.Item>
                      <Form.Item label="启用TLS加密" name="enableTLS" valuePropName="checked">
                        <Switch />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Divider />
                <div className="flex justify-end gap-2">
                  <Button>发送测试邮件</Button>
                  <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => handleSave('邮件', emailForm)}>
                    保存邮件配置
                  </Button>
                </div>
              </Form>
            </TabPane>

            {/* 短信服务 */}
            <TabPane tab={<span><MessageOutlined /> 短信服务</span>} key="4">
              <Form
                form={smsForm}
                layout="vertical"
                initialValues={initialSmsData}
              >
                <Card size="small" title="短信网关配置">
                  <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                      <Form.Item label="服务商" name="provider" rules={[{ required: true, message: '请选择短信服务商' }]}>
                        <Select>
                          <Option value="aliyun">阿里云短信</Option>
                          <Option value="tencent">腾讯云短信</Option>
                          <Option value="twilio">Twilio</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item label="Access Key ID" name="accessKeyId" rules={[{ required: true, message: '请输入Access Key ID' }]}>
                        <Input placeholder="Access Key ID" />
                      </Form.Item>
                      <Form.Item label="Access Key Secret" name="accessKeySecret" rules={[{ required: true, message: '请输入Access Key Secret' }]}>
                        <Input.Password placeholder="Access Key Secret" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="短信签名" name="signName" rules={[{ required: true, message: '请输入短信签名' }]}>
                        <Input placeholder="例如: GXT平台" />
                      </Form.Item>
                      <Form.Item label="模板CODE" name="templateCode" rules={[{ required: true, message: '请输入模板CODE' }]}>
                        <Input placeholder="例如: SMS_123456789" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Divider />
                <div className="flex justify-end gap-2">
                  <Button>发送测试短信</Button>
                  <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => handleSave('短信', smsForm)}>
                    保存短信配置
                  </Button>
                </div>
              </Form>
            </TabPane>

            {/* 文件存储 */}
            <TabPane tab={<span><CloudUploadOutlined /> 文件存储</span>} key="5">
              <Form
                form={storageForm}
                layout="vertical"
                initialValues={initialStorageData}
              >
                <Card size="small" title="存储服务配置">
                  <Row gutter={[16, 0]}>
                    <Col xs={24} md={12}>
                      <Form.Item label="存储服务商" name="provider" rules={[{ required: true, message: '请选择存储服务商' }]}>
                        <Select>
                          <Option value="oss">阿里云 OSS</Option>
                          <Option value="cos">腾讯云 COS</Option>
                          <Option value="s3">AWS S3</Option>
                          <Option value="local">本地存储</Option>
                        </Select>
                      </Form.Item>
                      <Form.Item label="Access Key ID" name="accessKeyId">
                        <Input placeholder="Access Key ID" />
                      </Form.Item>
                      <Form.Item label="Access Key Secret" name="accessKeySecret">
                        <Input.Password placeholder="Access Key Secret" />
                      </Form.Item>
                    </Col>
                    <Col xs={24} md={12}>
                      <Form.Item label="Bucket名称" name="bucket">
                        <Input placeholder="存储桶名称" />
                      </Form.Item>
                      <Form.Item label="区域" name="region">
                        <Input placeholder="例如: cn-hangzhou" />
                      </Form.Item>
                      <Form.Item label="访问域名" name="domain">
                        <Input placeholder="例如: https://files.gxt.com" />
                      </Form.Item>
                    </Col>
                  </Row>
                </Card>

                <Divider />
                <div className="flex justify-end gap-2">
                  <Button>测试连接</Button>
                  <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={() => handleSave('存储', storageForm)}>
                    保存存储配置
                  </Button>
                </div>
              </Form>
            </TabPane>
          </Tabs>
        </Card>
      </div>
    </AdminLayout>
  );
}
