'use client';

import React, { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Statistic, Select, Progress } from 'antd';
import { DollarOutlined, SyncOutlined, RiseOutlined, FallOutlined, WalletOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

interface Asset {
  id: string;
  symbol: string;
  name: string;
  chain: string;
  balance: string;
  valueUSD: string;
  change24h: number;
  share: number;
  status: string;
}

const mockAssets: Asset[] = [
  { id: '1', symbol: 'ETH', name: 'Ethereum', chain: 'Ethereum', balance: '125.5', valueUSD: '$878,500', change24h: 3.5, share: 35, status: 'active' },
  { id: '2', symbol: 'BTC', name: 'Bitcoin', chain: 'Bitcoin', balance: '25.8', valueUSD: '$1,741,500', change24h: -1.2, share: 45, status: 'active' },
  { id: '3', symbol: 'BNB', name: 'Binance Coin', chain: 'BSC', balance: '5,000', valueUSD: '$1,500,000', change24h: 5.8, share: 10, status: 'active' },
  { id: '4', symbol: 'MATIC', name: 'Polygon', chain: 'Polygon', balance: '100,000', valueUSD: '$85,000', change24h: 2.1, share: 5, status: 'active' },
  { id: '5', symbol: 'USDT', name: 'Tether', chain: 'Ethereum', balance: '500,000', valueUSD: '$500,000', change24h: 0.01, share: 5, status: 'active' },
];

export default function AssetMonitoringPage() {
  const [selectedChain, setSelectedChain] = useState('all');

  const columns = [
    { title: '币种', dataIndex: 'symbol', key: 'symbol', render: (text: string, record: Asset) => <span className="font-semibold">{text} <span className="text-gray-500 font-normal">({record.name})</span></span> },
    { title: '公链', dataIndex: 'chain', key: 'chain' },
    { title: '余额', dataIndex: 'balance', key: 'balance', render: (text: string, record: Asset) => `${text} ${record.symbol}` },
    { title: '价值 (USD)', dataIndex: 'valueUSD', key: 'valueUSD', render: (text: string) => <span className="font-semibold">{text}</span> },
    { 
      title: '24h 涨跌', 
      dataIndex: 'change24h', 
      key: 'change24h',
      render: (val: number) => (
        <span className={val >= 0 ? 'text-green-600' : 'text-red-600'}>
          {val >= 0 ? <RiseOutlined /> : <FallOutlined />}
          {' '}{val >= 0 ? '+' : ''}{val}%
        </span>
      )
    },
    { 
      title: '占比', 
      dataIndex: 'share', 
      key: 'share',
      render: (val: number) => (
        <div className="flex items-center gap-2">
          <Progress percent={val} size="small" strokeColor={val > 30 ? '#10b981' : val > 10 ? '#3b82f6' : '#6366f1'} />
          <span>{val}%</span>
        </div>
      )
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '正常' : '异常'}
        </Tag>
      )
    },
  ];

  const totalValue = '4,705,000';
  const totalChange = 1.2;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <WalletOutlined className="text-2xl text-indigo-600" />
            <h1 className="text-2xl font-bold m-0">资产监控</h1>
          </div>
          <Space>
            <Select 
              placeholder="筛选公链" 
              style={{ width: 150 }} 
              value={selectedChain}
              onChange={setSelectedChain}
            >
              <Select.Option value="all">全部</Select.Option>
              <Select.Option value="Ethereum">Ethereum</Select.Option>
              <Select.Option value="Bitcoin">Bitcoin</Select.Option>
              <Select.Option value="BSC">BSC</Select.Option>
              <Select.Option value="Polygon">Polygon</Select.Option>
            </Select>
            <Button icon={<SyncOutlined />}>刷新数据</Button>
          </Space>
        </div>

        <Row gutter={16}>
          <Col span={6}>
            <Card>
              <Statistic 
                title="总资产 (USD)" 
                value={totalValue} 
                prefix={<DollarOutlined />}
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="24h 变化" 
                value={totalChange} 
                suffix="%"
                prefix={totalChange >= 0 ? <RiseOutlined /> : <FallOutlined />}
                valueStyle={{ color: totalChange >= 0 ? '#3f8600' : '#B91C1C' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="币种数量" 
                value={mockAssets.length}
                valueStyle={{ color: '#1677FF' }}
              />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic 
                title="公链数量" 
                value={4}
                valueStyle={{ color: '#7C3AED' }}
              />
            </Card>
          </Col>
        </Row>

        <Card>
          <Table
            dataSource={mockAssets}
            columns={columns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>
      </div>
    </AdminLayout>
  );
}