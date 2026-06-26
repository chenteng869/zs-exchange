'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Statistic, Progress } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, PlusOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import UserLayout from '@/components/user/UserLayout';

const mockAssets = [
  { id: '1', symbol: 'GXT', name: '国学通证', balance: 12500.50, value: 12500.50, change: 5.2, chain: 'ETH' },
  { id: '2', symbol: 'ETH', name: '以太坊', balance: 2.5, value: 7500.00, change: -1.8, chain: 'ETH' },
  { id: '3', symbol: 'USDT', name: '泰达币', balance: 50000.00, value: 50000.00, change: 0.0, chain: 'ETH' },
  { id: '4', symbol: 'BTC', name: '比特币', balance: 0.5, value: 35000.00, change: 2.3, chain: 'BTC' },
  { id: '5', symbol: 'USDC', name: 'USD Coin', balance: 25000.00, value: 25000.00, change: 0.0, chain: 'ETH' },
  { id: '6', symbol: 'BNB', name: 'Binance Coin', balance: 15.2, value: 4560.00, change: 1.2, chain: 'BNB' },
];

const mockDistribution = [
  { name: 'GXT', value: 12500.50 },
  { name: 'ETH', value: 7500.00 },
  { name: 'USDT', value: 50000.00 },
  { name: 'BTC', value: 35000.00 },
  { name: 'USDC', value: 25000.00 },
  { name: 'BNB', value: 4560.00 },
];

const distributionOption = {
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left' },
  series: [
    {
      name: '资产分布',
      type: 'pie',
      radius: '50%',
      data: mockDistribution,
      emphasis: { itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0, 0, 0, 0.5)' } },
    },
  ],
};

export default function UserWalletAssets() {
  const [assets] = useState(mockAssets);

  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  const columns = [
    {
      title: '代币',
      dataIndex: 'symbol',
      key: 'symbol',
      width: 180,
      render: (text: string, record: any) => (
        <Space>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-bold text-white">{text[0]}</div>
          <div>
            <div className="font-semibold">{text}</div>
            <div className="text-xs text-gray-500">{record.name}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '链',
      dataIndex: 'chain',
      key: 'chain',
      width: 100,
      render: (chain: string) => <Tag color="blue">{chain}</Tag>,
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      width: 180,
      render: (val: number, record: any) => (
        <div>
          <div className="font-semibold">{val.toLocaleString()}</div>
          <div className="text-xs text-gray-500">≈ ${record.value.toLocaleString()}</div>
        </div>
      ),
    },
    {
      title: '价值',
      dataIndex: 'value',
      key: 'value',
      width: 150,
      render: (val: number) => (
        <div>
          <div className="font-semibold">${val.toLocaleString()}</div>
          <Progress percent={(val / totalValue * 100).toFixed(1) as unknown as number} size="small" showInfo={false} />
        </div>
      ),
    },
    {
      title: '24h变化',
      dataIndex: 'change',
      key: 'change',
      width: 120,
      render: (val: number) => (
        <Tag color={val > 0 ? 'green' : val < 0 ? 'red' : 'default'}>
          {val > 0 ? <ArrowUpOutlined /> : val < 0 ? <ArrowDownOutlined /> : ''} {Math.abs(val)}%
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: () => (
        <Space size="small">
          <Button type="primary" size="small">充值</Button>
          <Button type="default" size="small">提现</Button>
          <Button type="link" size="small">交易</Button>
        </Space>
      ),
    },
  ];

  return (
    <UserLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold m-0">资产概览</h1>
          <Button type="primary" icon={<PlusOutlined />}>添加代币</Button>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总资产价值"
                value={totalValue}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#3f8600' }}
              />
              <div className="text-green-500 text-sm mt-2">
                <ArrowUpOutlined /> +2.3% (24h)
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="可用余额"
                value={totalValue - 25000}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#1890ff' }}
              />
              <Progress percent={75} size="small" status="active" />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="质押金额"
                value={15000}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#722ed1' }}
              />
              <div className="text-xs text-gray-500 mt-2">约占总资产 14.3%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="未实现盈亏"
                value={2500.50}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#52c41a' }}
              />
              <div className="text-green-500 text-sm mt-2">+3.1% 总回报率</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="我的资产">
              <Table
                dataSource={assets}
                columns={columns}
                pagination={{ pageSize: 10 }}
                rowKey="id"
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="资产分布">
              <SafeECharts option={distributionOption} style={{ height: 350 }} title="资产分布" />
            </Card>
            
            <Card title="快捷操作" className="mt-4">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Button type="primary" block size="large" onClick={() => window.location.href = '/user/wallet/deposit'}>
                  <PlusOutlined /> 充值
                </Button>
                <Button block size="large" onClick={() => window.location.href = '/user/wallet/withdraw'}>
                  提现
                </Button>
                <Button block size="large" onClick={() => window.location.href = '/user/defi/swap'}>
                  兑换
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </UserLayout>
  );
}
