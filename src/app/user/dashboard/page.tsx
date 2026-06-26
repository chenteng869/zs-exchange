'use client';

import { useState } from 'react';
import { Card, Row, Col, Statistic, Progress, Table, Tag, Button, Space } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, WalletOutlined, SwapOutlined, TrophyOutlined, EyeOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import UserLayout from '@/components/user/UserLayout';

const mockAssets = [
  { id: '1', symbol: 'GXT', name: '国学通证', balance: 12500.50, value: 12500.50, change: 5.2 },
  { id: '2', symbol: 'ETH', name: '以太坊', balance: 2.5, value: 7500.00, change: -1.8 },
  { id: '3', symbol: 'USDT', name: '泰达币', balance: 50000.00, value: 50000.00, change: 0.0 },
  { id: '4', symbol: 'BTC', name: '比特币', balance: 0.5, value: 35000.00, change: 2.3 },
];

const mockRecentTransactions = [
  { id: '1', type: 'deposit', token: 'ETH', amount: 1.5, time: '2026-05-13 10:30:00', status: 'success' },
  { id: '2', type: 'swap', token: 'GXT', amount: 5000, time: '2026-05-13 09:15:00', status: 'success' },
  { id: '3', type: 'withdraw', token: 'USDT', amount: 1000, time: '2026-05-12 16:45:00', status: 'pending' },
  { id: '4', type: 'staking', token: 'GXT', amount: 10000, time: '2026-05-12 14:20:00', status: 'success' },
  { id: '5', type: 'reward', token: 'GXT', amount: 125.5, time: '2026-05-12 08:00:00', status: 'success' },
];

const assetTrendOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value' },
  series: [
    { type: 'line', smooth: true, data: [95000, 98000, 102000, 99000, 105000, 108000, 105000], name: '总资产(USDT)' },
  ],
};

export default function UserDashboard() {
  const [assets] = useState(mockAssets);
  const [transactions] = useState(mockRecentTransactions);

  const totalValue = assets.reduce((sum, asset) => sum + asset.value, 0);

  const assetColumns = [
    {
      title: '代币',
      dataIndex: 'symbol',
      key: 'symbol',
      render: (text: string, record: any) => (
        <Space>
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">{text[0]}</div>
          <div>
            <div className="font-semibold">{text}</div>
            <div className="text-xs text-gray-500">{record.name}</div>
          </div>
        </Space>
      ),
    },
    {
      title: '余额',
      dataIndex: 'balance',
      key: 'balance',
      render: (val: number, record: any) => (
        <div>
          <div className="font-semibold">{val.toLocaleString()}</div>
          <div className="text-xs text-gray-500">${record.value.toLocaleString()}</div>
        </div>
      ),
    },
    {
      title: '24h变化',
      dataIndex: 'change',
      key: 'change',
      render: (val: number) => (
        <Tag color={val > 0 ? 'green' : val < 0 ? 'red' : 'default'}>
          {val > 0 ? <ArrowUpOutlined /> : val < 0 ? <ArrowDownOutlined /> : ''} {Math.abs(val)}%
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: () => (
        <Space size="small">
          <Button type="link" size="small">交易</Button>
          <Button type="link" size="small">充值</Button>
          <Button type="link" size="small">提现</Button>
        </Space>
      ),
    },
  ];

  const transactionColumns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => {
        const typeMap: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
          deposit: { color: 'blue', text: '充值', icon: <WalletOutlined /> },
          withdraw: { color: 'orange', text: '提现', icon: <WalletOutlined /> },
          swap: { color: 'purple', text: '兑换', icon: <SwapOutlined /> },
          staking: { color: 'green', text: '质押', icon: <TrophyOutlined /> },
          reward: { color: 'gold', text: '奖励', icon: <TrophyOutlined /> },
        };
        const t = typeMap[type] || { color: 'default', text: type, icon: null };
        return <Tag color={t.color}>{t.icon} {t.text}</Tag>;
      },
    },
    { title: '代币', dataIndex: 'token', key: 'token' },
    { title: '数量', dataIndex: 'amount', key: 'amount', render: (val: number) => val.toLocaleString() },
    { title: '时间', dataIndex: 'time', key: 'time' },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusMap: Record<string, { color: string; text: string }> = {
          success: { color: 'success', text: '成功' },
          pending: { color: 'processing', text: '处理中' },
          failed: { color: 'error', text: '失败' },
        };
        const s = statusMap[status] || { color: 'default', text: status };
        return <Tag color={s.color}>{s.text}</Tag>;
      },
    },
    {
      title: '操作',
      key: 'action',
      render: () => <Button type="link" size="small" icon={<EyeOutlined />}>详情</Button>,
    },
  ];

  return (
    <UserLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold m-0">首页概览</h1>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总资产(USDT)"
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
                title="持仓收益"
                value={2500.50}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#52c41a' }}
              />
              <div className="text-green-500 text-sm mt-2">
                <ArrowUpOutlined /> +3.1% (24h)
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="质押金额"
                value={15000}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#1890ff' }}
              />
              <Progress percent={60} size="small" />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="待领取奖励"
                value={125.5}
                precision={2}
                suffix="GXT"
                valueStyle={{ color: '#fa8c16' }}
              />
              <Button type="primary" size="small" className="mt-2">领取</Button>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title="资产走势">
              <SafeECharts option={assetTrendOption} style={{ height: 300 }} title="资产走势" />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="快速操作">
              <Row gutter={[16, 16]}>
                <Col xs={12}>
                  <Card hoverable className="text-center cursor-pointer" onClick={() => window.location.href = '/user/wallet/deposit'}>
                    <WalletOutlined className="text-4xl text-blue-500 mb-2" />
                    <div className="font-semibold">充值</div>
                  </Card>
                </Col>
                <Col xs={12}>
                  <Card hoverable className="text-center cursor-pointer" onClick={() => window.location.href = '/user/wallet/withdraw'}>
                    <WalletOutlined className="text-4xl text-orange-500 mb-2" />
                    <div className="font-semibold">提现</div>
                  </Card>
                </Col>
                <Col xs={12}>
                  <Card hoverable className="text-center cursor-pointer" onClick={() => window.location.href = '/user/defi/swap'}>
                    <SwapOutlined className="text-4xl text-purple-500 mb-2" />
                    <div className="font-semibold">闪兑</div>
                  </Card>
                </Col>
                <Col xs={12}>
                  <Card hoverable className="text-center cursor-pointer" onClick={() => window.location.href = '/user/defi/staking'}>
                    <TrophyOutlined className="text-4xl text-green-500 mb-2" />
                    <div className="font-semibold">质押</div>
                  </Card>
                </Col>
              </Row>
            </Card>
          </Col>
        </Row>

        <Card title="资产列表" extra={<Button type="link">查看全部</Button>}>
          <Table
            dataSource={assets}
            columns={assetColumns}
            pagination={false}
            rowKey="id"
          />
        </Card>

        <Card title="最近交易" extra={<Button type="link" onClick={() => window.location.href = '/user/wallet/transactions'}>查看全部</Button>}>
          <Table
            dataSource={transactions}
            columns={transactionColumns}
            pagination={false}
            rowKey="id"
          />
        </Card>
      </div>
    </UserLayout>
  );
}
