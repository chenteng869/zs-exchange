'use client';

import { useState } from 'react';
import { Card, Row, Col, Button, Steps, Form, Input, Upload, Alert, Modal, Space, Tag, Typography } from 'antd';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import UserLayout from '@/components/user/UserLayout';

const { Step } = Steps;
const { Title, Text } = Typography;

export default function UserAccountKyc() {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [isSubmitted, setIsSubmitted] = useState(false);

  const kycStatus = {
    level: 1,
    status: 'pending', // pending, approved, rejected
    submitTime: '2026-05-10 14:30:00',
  };

  const statusMap = {
    pending: { color: 'orange', text: '审核中', icon: <ClockCircleOutlined /> },
    approved: { color: 'green', text: '已通过', icon: <CheckCircleOutlined /> },
    rejected: { color: 'red', text: '已驳回', icon: <CloseCircleOutlined /> },
  };

  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1);
    } else {
      form.validateFields().then(() => {
        setIsSubmitted(true);
        Modal.success({
          title: '提交成功',
          content: 'KYC资料已提交，请等待审核',
        });
      });
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const uploadProps = {
    beforeUpload: () => false,
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold m-0">KYC 身份认证</h1>

        <Alert
          message={`当前认证等级：Level ${kycStatus.level}`}
          description={
            <div>
              <Space>
                <Tag color={statusMap[kycStatus.status as keyof typeof statusMap].color}>
                  {statusMap[kycStatus.status as keyof typeof statusMap].icon}
                  {statusMap[kycStatus.status as keyof typeof statusMap].text}
                </Tag>
                {kycStatus.submitTime && <span className="text-gray-500">提交时间：{kycStatus.submitTime}</span>}
              </Space>
            </div>
          }
          type={kycStatus.status === 'approved' ? 'success' : kycStatus.status === 'rejected' ? 'error' : 'info'}
          showIcon
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="身份认证">
              {!isSubmitted ? (
                <>
                  <Steps current={currentStep} items={[
                    { title: '个人信息' },
                    { title: '证件上传' },
                    { title: '确认提交' },
                  ]} className="mb-8" />

                  <Form form={form} layout="vertical">
                    {currentStep === 0 && (
                      <div>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label="姓名"
                              name="name"
                              rules={[{ required: true, message: '请输入姓名' }]}
                            >
                              <Input placeholder="请输入真实姓名" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label="国籍"
                              name="nationality"
                              rules={[{ required: true, message: '请选择国籍' }]}
                            >
                              <Input placeholder="请输入国籍" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label="证件类型"
                              name="idType"
                              rules={[{ required: true, message: '请选择证件类型' }]}
                            >
                              <Input placeholder="请选择证件类型" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label="证件号码"
                              name="idNumber"
                              rules={[{ required: true, message: '请输入证件号码' }]}
                            >
                              <Input placeholder="请输入证件号码" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label="出生日期"
                              name="birthday"
                              rules={[{ required: true, message: '请选择出生日期' }]}
                            >
                              <Input placeholder="YYYY-MM-DD" />
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item
                              label="居住地址"
                              name="address"
                              rules={[{ required: true, message: '请输入居住地址' }]}
                            >
                              <Input placeholder="请输入详细地址" />
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    )}

                    {currentStep === 1 && (
                      <div>
                        <Row gutter={[16, 16]}>
                          <Col xs={24} sm={12}>
                            <Form.Item label="身份证正面" name="idFront" rules={[{ required: true, message: '请上传身份证正面' }]}>
                              <Upload {...uploadProps} listType="picture">
                                <Button icon={<UploadOutlined />}>点击上传</Button>
                              </Upload>
                            </Form.Item>
                          </Col>
                          <Col xs={24} sm={12}>
                            <Form.Item label="身份证背面" name="idBack" rules={[{ required: true, message: '请上传身份证背面' }]}>
                              <Upload {...uploadProps} listType="picture">
                                <Button icon={<UploadOutlined />}>点击上传</Button>
                              </Upload>
                            </Form.Item>
                          </Col>
                          <Col xs={24}>
                            <Form.Item label="手持证件照" name="idHand" rules={[{ required: true, message: '请上传手持证件照' }]}>
                              <Upload {...uploadProps} listType="picture">
                                <Button icon={<UploadOutlined />}>点击上传</Button>
                              </Upload>
                              <Text type="secondary" className="text-sm block mt-2">
                                请确保照片清晰，证件信息可见，无遮挡
                              </Text>
                            </Form.Item>
                          </Col>
                        </Row>
                      </div>
                    )}

                    {currentStep === 2 && (
                      <div className="bg-gray-50 p-6 rounded-lg">
                        <Title level={4}>确认信息</Title>
                        <div className="space-y-2 mt-4">
                          <div className="flex justify-between">
                            <Text className="text-gray-500">姓名：</Text>
                            <Text strong>{form.getFieldValue('name') || '-'}</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text className="text-gray-500">国籍：</Text>
                            <Text strong>{form.getFieldValue('nationality') || '-'}</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text className="text-gray-500">证件类型：</Text>
                            <Text strong>{form.getFieldValue('idType') || '-'}</Text>
                          </div>
                          <div className="flex justify-between">
                            <Text className="text-gray-500">证件号码：</Text>
                            <Text strong>{form.getFieldValue('idNumber') || '-'}</Text>
                          </div>
                        </div>
                        <Alert
                          message="请确认以上信息准确无误"
                          description="虚假信息可能导致认证失败或账户限制"
                          type="warning"
                          showIcon
                          className="mt-4"
                        />
                      </div>
                    )}

                    <div className="flex justify-between mt-8">
                      <Button disabled={currentStep === 0} onClick={handlePrev}>
                        上一步
                      </Button>
                      <Button type="primary" onClick={handleNext}>
                        {currentStep === 2 ? '提交审核' : '下一步'}
                      </Button>
                    </div>
                  </Form>
                </>
              ) : (
                <div className="text-center py-12">
                  <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
                  <Title level={3}>资料已提交</Title>
                  <Text type="secondary" className="block mb-6">
                    我们会在1-3个工作日内完成审核，请耐心等待
                  </Text>
                  <Space>
                    <Button type="primary">查看状态</Button>
                    <Button onClick={() => setIsSubmitted(false)}>重新提交</Button>
                  </Space>
                </div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="认证等级权益">
              <div className="space-y-4">
                <Card size="small" className="border-l-4 border-l-blue-500">
                  <div className="font-semibold mb-1">Level 1 - 基础认证</div>
                  <div className="text-sm text-gray-500">
                    充值、小额提现（单日限额 $10,000）
                  </div>
                  <Tag color="green" className="mt-2">当前等级</Tag>
                </Card>

                <Card size="small" className="border-l-4 border-l-purple-500">
                  <div className="font-semibold mb-1">Level 2 - 完整认证</div>
                  <div className="text-sm text-gray-500">
                    提高提现限额（单日限额 $100,000）、参与 IDO、DeFi 挖矿
                  </div>
                  <Tag color="blue" className="mt-2">待认证</Tag>
                </Card>

                <Card size="small" className="border-l-4 border-l-orange-500">
                  <div className="font-semibold mb-1">Level 3 - 高级认证</div>
                  <div className="text-sm text-gray-500">
                    无限额提现、专属客服、VIP 活动邀请
                  </div>
                  <Tag color="default" className="mt-2">待解锁</Tag>
                </Card>
              </div>
            </Card>

            <Card title="认证须知" className="mt-4">
              <ul className="text-sm text-gray-600 space-y-2">
                <li>• 请上传清晰、无遮挡的证件照片</li>
                <li>• 确保信息与证件完全一致</li>
                <li>• 同一证件只能认证一个账户</li>
                <li>• 审核期间请勿重复提交</li>
                <li>• 如有疑问请联系客服</li>
              </ul>
            </Card>
          </Col>
        </Row>
      </div>
    </UserLayout>
  );
}
