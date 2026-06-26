'use client';

import { useState } from 'react';
import { Card, Select, Button, Input, Alert, Steps, Space, Row, Col, Typography } from 'antd';
import { CheckCircleOutlined, CopyOutlined } from '@ant-design/icons';
import UserLayout from '@/components/user/UserLayout';

const { Option } = Select;
const { Step } = Steps;
const { Title, Text } = Typography;

const depositAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8f7';

const mockChains = [
  { id: 'ETH', name: '以太坊 (Ethereum)', icon: 'Ξ', confirmations: 12 },
  { id: 'BNB', name: '币安智能链 (BSC)', icon: '🔶', confirmations: 15 },
  { id: 'Polygon', name: 'Polygon (MATIC)', icon: '🟣', confirmations: 100 },
  { id: 'Arbitrum', name: 'Arbitrum One', icon: '🔵', confirmations: 20 },
];

const mockTokens = [
  { id: 'ETH', name: 'ETH', symbol: 'ETH', chains: ['ETH'] },
  { id: 'USDT', name: 'Tether', symbol: 'USDT', chains: ['ETH', 'BNB', 'Polygon', 'Arbitrum'] },
  { id: 'GXT', name: '国学通证', symbol: 'GXT', chains: ['ETH', 'BNB'] },
  { id: 'USDC', name: 'USD Coin', symbol: 'USDC', chains: ['ETH', 'Polygon', 'Arbitrum'] },
];

export default function UserWalletDeposit() {
  const [selectedChain, setSelectedChain] = useState<string>('ETH');
  const [selectedToken, setSelectedToken] = useState<string>('USDT');
  const [copied, setCopied] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const availableTokens = mockTokens.filter(token => token.chains.includes(selectedChain));
  const selectedChainData = mockChains.find(chain => chain.id === selectedChain);
  const selectedTokenData = mockTokens.find(token => token.id === selectedToken);

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(depositAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold m-0">充值</h1>

        <Alert
          message="重要提示"
          description="请确保您选择了正确的网络和代币。发送到错误的地址可能导致资产永久丢失！"
          type="warning"
          showIcon
        />

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="选择充值方式">
              <Steps current={currentStep} items={[
                { title: '选择网络' },
                { title: '选择代币' },
                { title: '获取地址' },
              ]} className="mb-8" />

              <div className="space-y-6">
                <div>
                  <Title level={5}>第一步：选择网络</Title>
                  <Select
                    placeholder="选择区块链网络"
                    style={{ width: '100%' }}
                    value={selectedChain}
                    onChange={(value) => {
                      setSelectedChain(value);
                      setCurrentStep(1);
                    }}
                    size="large"
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
                </div>

                {currentStep >= 1 && (
                  <div>
                    <Title level={5}>第二步：选择代币</Title>
                    <Select
                      placeholder="选择要充值的代币"
                      style={{ width: '100%' }}
                      value={selectedToken}
                      onChange={(value) => {
                        setSelectedToken(value);
                        setCurrentStep(2);
                      }}
                      size="large"
                    >
                      {availableTokens.map(token => (
                        <Option key={token.id} value={token.id}>
                          {token.name} ({token.symbol})
                        </Option>
                      ))}
                    </Select>
                  </div>
                )}

                {currentStep >= 2 && (
                  <div>
                    <Title level={5}>第三步：发送到以下地址</Title>
                    <Card
                      className="bg-gray-50"
                      bodyStyle={{ padding: '24px' }}
                    >
                      <div className="text-center space-y-4">
                        <div className="text-sm text-gray-600">
                          充值网络：<Text strong>{selectedChainData?.name}</Text>
                        </div>
                        <div className="text-sm text-gray-600">
                          代币：<Text strong>{selectedTokenData?.symbol}</Text>
                        </div>
                        
                        <div className="bg-white p-4 rounded-lg border border-gray-200">
                          <Text className="font-mono text-lg break-all">{depositAddress}</Text>
                          <div className="mt-3">
                            <Button
                              type={copied ? 'default' : 'primary'}
                              icon={copied ? <CheckCircleOutlined /> : <CopyOutlined />}
                              onClick={handleCopyAddress}
                            >
                              {copied ? '已复制' : '复制地址'}
                            </Button>
                          </div>
                        </div>

                        <Alert
                          message={`需要 ${selectedChainData?.confirmations} 个区块确认后才能到账`}
                          type="info"
                          showIcon
                        />
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title="充值说明">
              <div className="space-y-4">
                <div>
                  <Text strong>重要安全提示：</Text>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• 确认选择正确的网络</li>
                    <li>• 确认发送正确的代币</li>
                    <li>• 小额先测试，确认到账</li>
                    <li>• 保留交易哈希备查</li>
                  </ul>
                </div>

                <div>
                  <Text strong>到账时间：</Text>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• ETH网络：约 2-5 分钟</li>
                    <li>• BSC网络：约 1-3 分钟</li>
                    <li>• Polygon网络：约 30 秒-2 分钟</li>
                  </ul>
                </div>

                <div>
                  <Text strong>最低充值金额：</Text>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600">
                    <li>• ETH：0.01 ETH</li>
                    <li>• USDT：10 USDT</li>
                    <li>• GXT：100 GXT</li>
                  </ul>
                </div>
              </div>
            </Card>

            <Card title="最近充值" className="mt-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <Text className="text-green-600">+ 1.5 ETH</Text>
                  <Text type="secondary" className="text-sm">2小时前</Text>
                </div>
                <div className="flex justify-between items-center">
                  <Text className="text-green-600">+ 5000 USDT</Text>
                  <Text type="secondary" className="text-sm">昨天</Text>
                </div>
                <div className="flex justify-between items-center">
                  <Text className="text-blue-600">确认中...</Text>
                  <Text type="secondary" className="text-sm">10分钟前</Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </UserLayout>
  );
}
