'use client';

import { useState } from 'react';
import { Card, Row, Col, Button, Select, InputNumber, Space, Statistic, Progress, Alert, Tag } from 'antd';
import { SwapOutlined, ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import UserLayout from '@/components/user/UserLayout';

const { Option } = Select;

const mockTokens = [
  { symbol: 'GXT', name: '国学通证', balance: 12500.5 },
  { symbol: 'ETH', name: '以太坊', balance: 2.5 },
  { symbol: 'USDT', name: '泰达币', balance: 50000 },
  { symbol: 'BTC', name: '比特币', balance: 0.5 },
  { symbol: 'USDC', name: 'USD Coin', balance: 25000 },
];

const priceChartOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
  yAxis: { type: 'value' },
  series: [
    { type: 'line', smooth: true, data: [1.0, 1.02, 0.98, 1.05, 1.03, 1.08, 1.06], name: 'GXT/USDT' },
  ],
};

export default function UserDefiSwap() {
  const [fromToken, setFromToken] = useState('USDT');
  const [toToken, setToToken] = useState('GXT');
  const [fromAmount, setFromAmount] = useState<number | null>(null);
  const [toAmount, setToAmount] = useState<number | null>(null);
  const [slippage, setSlippage] = useState(0.5);

  const fromTokenInfo = mockTokens.find(t => t.symbol === fromToken);
  const toTokenInfo = mockTokens.find(t => t.symbol === toToken);

  const exchangeRate = 1.06;

  const handleSwapTokens = () => {
    const temp = fromToken;
    setFromToken(toToken);
    setToToken(temp);
    setFromAmount(toAmount);
    setToAmount(fromAmount);
  };

  const handleFromAmountChange = (value: number | null) => {
    setFromAmount(value);
    if (value) {
      setToAmount(value * exchangeRate);
    } else {
      setToAmount(null);
    }
  };

  const handleSwap = () => {
    // 交换逻辑
  };

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold m-0">闪兑交易</h1>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={10}>
            <Card title="兑换">
              <div className="space-y-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500">从</span>
                    <span className="text-sm text-gray-500">
                      余额: {fromTokenInfo?.balance.toLocaleString()} {fromTokenInfo?.symbol}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <InputNumber
                      style={{ flex: 1 }}
                      placeholder="0.0"
                      value={fromAmount}
                      onChange={handleFromAmountChange}
                      min={0}
                      precision={8}
                      size="large"
                    />
                    <Select
                      value={fromToken}
                      onChange={setFromToken}
                      size="large"
                      style={{ width: 150 }}
                    >
                      {mockTokens.map(token => (
                        <Option key={token.symbol} value={token.symbol}>
                          {token.symbol}
                        </Option>
                      ))}
                    </Select>
                  </div>
                  <Button type="link" size="small" onClick={() => handleFromAmountChange(fromTokenInfo?.balance || 0)}>
                    全部
                  </Button>
                </div>

                <div className="text-center">
                  <Button
                    shape="circle"
                    icon={<SwapOutlined />}
                    onClick={handleSwapTokens}
                    className="transform rotate-90"
                    size="large"
                  />
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-500">到</span>
                    <span className="text-sm text-gray-500">
                      余额: {toTokenInfo?.balance.toLocaleString()} {toTokenInfo?.symbol}
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <InputNumber
                      style={{ flex: 1 }}
                      placeholder="0.0"
                      value={toAmount}
                      onChange={(v) => setToAmount(Number(v ?? 0))}
                      min={0}
                      precision={8}
                      size="large"
                    />
                    <Select
                      value={toToken}
                      onChange={setToToken}
                      size="large"
                      style={{ width: 150 }}
                    >
                      {mockTokens.map(token => (
                        <Option key={token.symbol} value={token.symbol}>
                          {token.symbol}
                        </Option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">汇率</span>
                    <span className="font-semibold">1 {fromToken} ≈ {exchangeRate} {toToken}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">滑点容忍度</span>
                    <Select
                      value={slippage}
                      onChange={setSlippage}
                      style={{ width: 100 }}
                      size="small"
                    >
                      <Option value={0.1}>0.1%</Option>
                      <Option value={0.5}>0.5%</Option>
                      <Option value={1.0}>1.0%</Option>
                    </Select>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">网络费用</span>
                    <span>≈ $0.5 - $2.0</span>
                  </div>
                </div>

                <Button
                  type="primary"
                  size="large"
                  block
                  onClick={handleSwap}
                  disabled={!fromAmount}
                >
                  确认兑换
                </Button>

                <Alert
                  message="提示"
                  description="闪兑价格实时变化，实际兑换价格以交易时为准"
                  type="info"
                  showIcon
                />
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={14}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="24h 交易量"
                    value={5280000}
                    prefix="$"
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="24h 价格变化"
                    value={6.8}
                    precision={1}
                    suffix="%"
                    valueStyle={{ color: '#52c41a' }}
                    prefix={<ArrowUpOutlined />}
                  />
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card>
                  <Statistic
                    title="流动性池"
                    value={25.8}
                    precision={1}
                    suffix="M"
                    prefix="$"
                  />
                </Card>
              </Col>
            </Row>

            <Card title={`${fromToken}/${toToken} 价格走势`} className="mt-4">
              <SafeECharts option={priceChartOption} style={{ height: 300 }} />
            </Card>

            <Card title="最近兑换记录" className="mt-4">
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex justify-between items-center py-2 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <Tag color="green">成功</Tag>
                      <span className="text-gray-500 text-sm">1{i}:3{i}</span>
                    </div>
                    <div className="text-right">
                      <div className="text-red-500">- {(100 * i).toFixed(2)} USDT</div>
                      <div className="text-green-600">+ {(106 * i).toFixed(2)} GXT</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </UserLayout>
  );
}
