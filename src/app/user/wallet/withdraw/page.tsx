'use client';

import { useState } from 'react';
import { Card, Select, Button, Input, InputNumber, Alert, Form, Row, Col, Typography, Modal, Space } from 'antd';
import { WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';
import UserLayout from '@/components/user/UserLayout';

const { Option } = Select;
const { Title, Text } = Typography;

const mockChains = [
  { id: 'ETH', name: '以太坊 (Ethereum)', icon: 'Ξ', gasFee: 0.002 },
  { id: 'BNB', name: '币安智能链 (BSC)', icon: '🔶', gasFee: 0.0005 },
  { id: 'Polygon', name: 'Polygon (MATIC)', icon: '🟣', gasFee: 0.01 },
];

const mockTokens = [
  { id: 'ETH', name: 'ETH', symbol: 'ETH', balance: 2.5, chains: ['ETH'] },
  { id: 'USDT', name: 'Tether', symbol: 'USDT', balance: 50000, chains: ['ETH', 'BNB', 'Polygon'] },
  { id: 'GXT', name: '国学通证', symbol: 'GXT', balance: 12500.50, chains: ['ETH', 'BNB'] },
  { id: 'USDC', name: 'USD Coin', symbol: 'USDC', balance: 25000, chains: ['ETH', 'Polygon'] },
];

export default function UserWalletWithdraw() {
  const [form] = Form.useForm();
  const [selectedChain, setSelectedChain] = useState<string>('ETH');
  const [selectedToken, setSelectedToken] = useState<string>('USDT');
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);

  const availableTokens = mockTokens.filter(token => token.chains.includes(selectedChain));
  const selectedTokenData = mockTokens.find(token => token.id === selectedToken);
  const selectedChainData = mockChains.find(chain => chain.id === selectedChain);

  const handleWithdraw = () => {
    form.validateFields().then(values => {
      setConfirmModalVisible(true);
    });
  };

  const handleConfirmWithdraw = () => {
    Modal.success({
      title: '提现已提交',
      content: '您的提现已提交到区块链网络，请等待确认。',
      onOk: () => {
        setConfirmModalVisible(false);
        form.resetFields();
      },
    });
  };

  const handleMaxAmount = () => {
    form.setFieldValue('amount', selectedTokenData?.balance || 0);
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold m-0">提现</h1>

        <Alert
          message="安全提示"
          description={
            <div>
              <Space direction="vertical" size="small">
                <Text>请确保接收地址正确，提现后无法撤销</Text>
                <Text type="secondary">建议先小额测试，确认无误后再大额提现</Text>
              </Space>
            </div>
          }
          type="warning"
          showIcon
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="提现信息">
              <Form form={form} layout="vertical" size="large">
                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="选择网络"
                      name="chain"
                      initialValue={selectedChain}
                      rules={[{ required: true, message: '请选择网络' }]}
                    >
                      <Select
                        onChange={(value) => setSelectedChain(value)}
                      >
                        {mockChains.map(chain => (
                          <Option key={chain.id} value={chain.id}>
                            <Space>
                              <span className="text-xl">{chain.icon}</span>
                              {chain.name}
                            </Space>
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12}>
                    <Form.Item
                      label="选择代币"
                      name="token"
                      initialValue={selectedToken}
                      rules={[{ required: true, message: '请选择代币' }]}
                    >
                      <Select
                        onChange={(value) => setSelectedToken(value)}
                      >
                        {availableTokens.map(token => (
                          <Option key={token.id} value={token.id}>
                            {token.name} ({token.symbol}) - 可用: {token.balance.toLocaleString()}
                          </Option>
                        ))}
                      </Select>
                    </Form.Item>
                  </Col>
                </Row>

                <Form.Item
                  label="接收地址"
                  name="address"
                  rules={[
                    { required: true, message: '请输入接收地址' },
                    { len: 42, message: '地址格式不正确' },
                  ]}
                >
                  <Input
                    placeholder="请输入接收地址"
                    prefix={<InfoCircleOutlined />}
                  />
                </Form.Item>

                <Row gutter={[16, 16]}>
                  <Col xs={24} sm={16}>
                    <Form.Item
                      label="提现数量"
                      name="amount"
                      rules={[
                        { required: true, message: '请输入提现数量' },
                        { type: 'number', min: 0.0001, message: '最小提现金额为0.0001' },
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            if (!value || value <= (selectedTokenData?.balance || 0)) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error('余额不足'));
                          },
                        }),
                      ]}
                >
                  <InputNumber
                    style={{ width: '100%' }}
                    placeholder="请输入提现数量"
                    min={0.0001}
                    max={selectedTokenData?.balance}
                    precision={8}
                    addonAfter={<Button type="link" onClick={handleMaxAmount}>全部</Button>}
                  />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item label="备注(可选)" name="remark">
                  <Input placeholder="备注信息" />
                </Form.Item>
              </Col>
            </Row>

            <Card className="bg-gray-50 mb-4">
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12}>
                  <div className="text-sm text-gray-600">
                    可用余额：<Text strong>{selectedTokenData?.balance.toLocaleString()} {selectedTokenData?.symbol}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="text-sm text-gray-600">
                    网络手续费：<Text strong>{selectedChainData?.gasFee} {selectedChain}</Text>
                  </div>
                </Col>
                <Col xs={24} sm={12}>
                  <div className="text-sm text-gray-600">
                    实际到账：<Text strong className="text-green-600">{(form.getFieldValue('amount') || 0)} {selectedTokenData?.symbol}</Text>
                  </div>
                </Col>
              </Row>
            </Card>

            <Form.Item>
              <Button
                type="primary"
                size="large"
                block
                onClick={handleWithdraw}
                danger
              >
                确认提现
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Col>

      <Col xs={24} lg={8}>
        <Card title="提现说明">
          <div className="space-y-4">
            <div>
              <Text strong>手续费说明：</Text>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• 网络手续费用于支付区块链矿工费用</li>
                <li>• 手续费会根据网络拥堵情况动态调整</li>
                <li>• 我们不收取额外提现手续费</li>
              </ul>
            </div>

            <div>
              <Text strong>到账时间：</Text>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• ETH网络：约 5-30 分钟</li>
                <li>• BSC网络：约 1-5 分钟</li>
                <li>• Polygon网络：约 30 秒-5 分钟</li>
              </ul>
            </div>

            <div>
              <Text strong>提现限额：</Text>
              <ul className="mt-2 space-y-1 text-sm text-gray-600">
                <li>• 单次最低：0.0001 {selectedTokenData?.symbol}</li>
                <li>• 单日最高：100,000 {selectedTokenData?.symbol}</li>
                <li>• KYC用户可提升限额</li>
              </ul>
            </div>
          </div>
        </Card>

        <Card title="最近提现" className="mt-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <Text className="text-orange-600">- 1000 USDT</Text>
              <Text type="secondary" className="text-sm">2小时前</Text>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-orange-600">- 0.1 ETH</Text>
              <Text type="secondary" className="text-sm">昨天</Text>
            </div>
            <div className="flex justify-between items-center">
              <Text className="text-blue-600">处理中...</Text>
              <Text type="secondary" className="text-sm">10分钟前</Text>
            </div>
          </div>
        </Card>
      </Col>
    </Row>

    <Modal
      title="确认提现"
      open={confirmModalVisible}
      onOk={handleConfirmWithdraw}
      onCancel={() => setConfirmModalVisible(false)}
      okText="确认"
      cancelText="取消"
      okButtonProps={{ danger: true }}
    >
      <div className="space-y-4">
        <Alert
          message="请再次确认以下信息"
          type="warning"
          showIcon
        />
        
        <div>
          <div className="text-sm text-gray-600">接收地址：</div>
          <div className="font-mono text-lg">{form.getFieldValue('address')}</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-600">提现数量：</div>
          <div className="text-lg font-bold">{form.getFieldValue('amount')} {selectedTokenData?.symbol}</div>
        </div>
        
        <div>
          <div className="text-sm text-gray-600">网络手续费：</div>
          <div>{selectedChainData?.gasFee} {selectedChain}</div>
        </div>
      </div>
    </Modal>
  </div>
</UserLayout>
);
}
