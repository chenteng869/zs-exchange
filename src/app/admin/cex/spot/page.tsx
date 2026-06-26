'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Form, Input, InputNumber, Select, Statistic, Tabs, Badge } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ShoppingCartOutlined, HistoryOutlined, SyncOutlined, SettingOutlined } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

// 模拟交易对数据
const mockTradingPairs = [
  { id: '1', symbol: 'GXT/USDT', base: 'GXT', quote: 'USDT', price: 0.8523, change: 2.56, volume24h: 1250000, high24h: 0.8850, low24h: 0.8230 },
  { id: '2', symbol: 'ETH/USDT', base: 'ETH', quote: 'USDT', price: 3285.50, change: -1.23, volume24h: 8500000, high24h: 3350.00, low24h: 3250.00 },
  { id: '3', symbol: 'BTC/USDT', base: 'BTC', quote: 'USDT', price: 67523.80, change: 0.85, volume24h: 15200000, high24h: 68000.00, low24h: 67000.00 },
  { id: '4', symbol: 'BNB/USDT', base: 'BNB', quote: 'USDT', price: 612.35, change: -0.45, volume24h: 2300000, high24h: 625.00, low24h: 608.00 },
  { id: '5', symbol: 'SOL/USDT', base: 'SOL', quote: 'USDT', price: 178.90, change: 3.21, volume24h: 4500000, high24h: 182.50, low24h: 175.00 },
];

// 模拟订单簿数据
const mockOrderBook = {
  bids: [
    { price: 0.8520, amount: 1500, total: 1278 },
    { price: 0.8515, amount: 2300, total: 1958.45 },
    { price: 0.8510, amount: 1800, total: 1531.8 },
    { price: 0.8505, amount: 3200, total: 2721.6 },
    { price: 0.8500, amount: 2100, total: 1785 },
  ],
  asks: [
    { price: 0.8525, amount: 1200, total: 1023 },
    { price: 0.8530, amount: 1800, total: 1535.4 },
    { price: 0.8535, amount: 2500, total: 2133.75 },
    { price: 0.8540, amount: 1600, total: 1366.4 },
    { price: 0.8545, amount: 2200, total: 1880 },
  ],
};

// 模拟最近成交
const mockTrades = [
  { id: '1', price: 0.8523, amount: 500, time: '14:32:15', type: 'buy' },
  { id: '2', price: 0.8521, amount: 320, time: '14:32:12', type: 'sell' },
  { id: '3', price: 0.8525, amount: 800, time: '14:32:08', type: 'buy' },
  { id: '4', price: 0.8519, amount: 450, time: '14:32:05', type: 'sell' },
  { id: '5', price: 0.8522, amount: 680, time: '14:32:01', type: 'buy' },
];

export default function SpotTradingPage() {
  const [selectedPair, setSelectedPair] = useState('GXT/USDT');
  const [orderType, setOrderType] = useState('limit');
  const [side, setSide] = useState('buy');
  const [price, setPrice] = useState(0.8523);
  const [amount, setAmount] = useState(100);

  const columns = [
    { 
      title: '交易对', 
      dataIndex: 'symbol', 
      key: 'symbol', 
      render: (text: string) => <span className="font-semibold text-blue-600">{text}</span> 
    },
    { 
      title: '价格', 
      dataIndex: 'price', 
      key: 'price', 
      render: (val: number) => <span className="font-mono">${val.toLocaleString()}</span> 
    },
    { 
      title: '24h涨跌', 
      dataIndex: 'change', 
      key: 'change', 
      render: (val: number) => (
        <span className={val >= 0 ? 'text-green-600' : 'text-red-600'}>
          {val >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {val}%
        </span>
      ) 
    },
    { 
      title: '24h成交量', 
      dataIndex: 'volume24h', 
      key: 'volume24h', 
      render: (val: number) => `$${(val / 1000000).toFixed(2)}M` 
    },
    { 
      title: '24h最高', 
      dataIndex: 'high24h', 
      key: 'high24h', 
      render: (val: number) => <span className="text-green-600">${val.toLocaleString()}</span> 
    },
    { 
      title: '24h最低', 
      dataIndex: 'low24h', 
      key: 'low24h', 
      render: (val: number) => <span className="text-red-600">${val.toLocaleString()}</span> 
    },
    { 
      title: '操作', 
      key: 'actions', 
      render: () => <Button type="link">交易</Button> 
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShoppingCartOutlined className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold m-0">币币交易</h1>
          </div>
          <Space>
            <Button icon={<SyncOutlined />}>刷新行情</Button>
            <Button icon={<SettingOutlined />} type="primary">交易设置</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title={`${selectedPair} 实时行情`}>
              <Tabs 
                defaultActiveKey="chart" 
                className="mb-4"
                items={[
                  {
                    key: 'chart',
                    label: 'K线图',
                    children: <div className="h-[300px] bg-gray-50 flex items-center justify-center text-gray-400">K线图 (图表功能开发中)</div>,
                  },
                  {
                    key: 'depth',
                    label: '深度图',
                    children: (
                      <Row>
                        <Col span={12}>
                          <h4 className="text-red-600 font-semibold mb-2">卖盘 (Ask)</h4>
                          <div className="space-y-1">
                            {mockOrderBook.asks.map((ask, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-red-500">{ask.price.toFixed(4)}</span>
                                <span>{ask.amount} {ask.total.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </Col>
                        <Col span={12}>
                          <h4 className="text-green-600 font-semibold mb-2">买盘 (Bid)</h4>
                          <div className="space-y-1">
                            {mockOrderBook.bids.map((bid, index) => (
                              <div key={index} className="flex justify-between text-sm">
                                <span className="text-green-500">{bid.price.toFixed(4)}</span>
                                <span>{bid.amount} {bid.total.toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </Col>
                      </Row>
                    ),
                  },
                ]}
              />

              <Card title="最近成交" size="small">
                <Table
                  dataSource={mockTrades}
                  columns={[
                    { title: '时间', dataIndex: 'time', key: 'time' },
                    { 
                      title: '价格', 
                      dataIndex: 'price', 
                      key: 'price',
                      render: (val) => <span className="font-mono">${val.toFixed(4)}</span>
                    },
                    { title: '数量', dataIndex: 'amount', key: 'amount' },
                    { 
                      title: '方向', 
                      dataIndex: 'type', 
                      key: 'type',
                      render: (val) => <Tag color={val === 'buy' ? 'green' : 'red'}>{val === 'buy' ? '买入' : '卖出'}</Tag>
                    },
                  ]}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />
              </Card>
            </Card>

            <Card title="交易对列表">
              <Table
                dataSource={mockTradingPairs}
                columns={columns}
                pagination={{ pageSize: 10 }}
                rowKey="id"
                onRow={(record) => ({
                  onClick: () => setSelectedPair(record.symbol),
                  className: selectedPair === record.symbol ? 'bg-blue-50' : '',
                })}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title={`${selectedPair} 交易`}>
              <div className="flex gap-2 mb-4">
                <Button 
                  type={side === 'buy' ? 'primary' : 'default'} 
                  onClick={() => setSide('buy')}
                  className="flex-1"
                >
                  买入
                </Button>
                <Button 
                  type={side === 'sell' ? 'primary' : 'default'} 
                  danger={side === 'sell'}
                  onClick={() => setSide('sell')}
                  className="flex-1"
                >
                  卖出
                </Button>
              </div>

              <Tabs 
                defaultActiveKey="limit"
                items={[
                  {
                    key: 'limit',
                    label: '限价单',
                    children: (
                      <Form layout="vertical">
                        <Form.Item label="价格 (USDT)">
                          <InputNumber 
                            className="w-full" 
                            value={price}
                            onChange={(value) => setPrice(value || 0)}
                            step={0.0001}
                            precision={4}
                            prefix="$"
                          />
                        </Form.Item>
                        <Form.Item label="数量 (GXT)">
                          <InputNumber 
                            className="w-full" 
                            value={amount}
                            onChange={(value) => setAmount(value || 0)}
                            step={1}
                          />
                        </Form.Item>
                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <div className="flex justify-between text-sm mb-1">
                            <span>预估金额:</span>
                            <span>${(price * amount).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>手续费:</span>
                            <span>${((price * amount) * 0.001).toFixed(4)}</span>
                          </div>
                          <div className="flex justify-between text-sm font-semibold">
                            <span>实付金额:</span>
                            <span>${((price * amount) * 1.001).toFixed(2)}</span>
                          </div>
                        </div>
                        <Button 
                          type="primary" 
                          size="large" 
                          className="w-full"
                          danger={side === 'sell'}
                        >
                          {side === 'buy' ? '买入' : '卖出'} {selectedPair.split('/')[0]}
                        </Button>
                      </Form>
                    ),
                  },
                  {
                    key: 'market',
                    label: '市价单',
                    children: (
                      <Form layout="vertical">
                        <Form.Item label="数量 (GXT)">
                          <InputNumber className="w-full" placeholder="输入数量" />
                        </Form.Item>
                        <div className="flex gap-2 mb-4">
                          <Button type="default" size="small" onClick={() => setAmount(25)}>25%</Button>
                          <Button type="default" size="small" onClick={() => setAmount(50)}>50%</Button>
                          <Button type="default" size="small" onClick={() => setAmount(75)}>75%</Button>
                          <Button type="default" size="small" onClick={() => setAmount(100)}>100%</Button>
                        </div>
                        <Button 
                          type="primary" 
                          size="large" 
                          className="w-full"
                          danger={side === 'sell'}
                        >
                          市价{side === 'buy' ? '买入' : '卖出'}
                        </Button>
                      </Form>
                    ),
                  },
                ]}
              />
            </Card>

            <Card title="账户余额" size="small">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>GXT</span>
                  <span className="font-semibold">1,250.00</span>
                </div>
                <div className="flex justify-between">
                  <span>USDT</span>
                  <span className="font-semibold">5,800.00</span>
                </div>
                <div className="flex justify-between">
                  <span>BTC</span>
                  <span className="font-semibold">0.523</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}
