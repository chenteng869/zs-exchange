'use client';

import { useEffect, useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Form, Input, InputNumber, Select, Statistic, Badge, Progress } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, CreditCardOutlined, SyncOutlined, CalculatorOutlined, AlertOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

const mockLoans = [
  { id: '1', asset: 'USDT', borrowed: 10000, interestRate: 0.05, days: 5, interest: 2.08, status: 'active' },
  { id: '2', asset: 'BTC', borrowed: 0.5, interestRate: 0.06, days: 3, interest: 0.0003, status: 'active' },
];

const chartOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00'] },
  yAxis: { type: 'value' },
  series: [{ type: 'line', smooth: true, data: [66000, 66500, 67000, 66800, 67200, 67400, 67523], areaStyle: {} }],
};

export default function MarginTradingPage() {
  const [selectedPair, setSelectedPair] = useState('BTC/USDT');
  const [side, setSide] = useState('long');
  const [leverage, setLeverage] = useState(5);
  const [price, setPrice] = useState(67523.80);
  const [quantity, setQuantity] = useState(0.1);
  const [marginPairs, setMarginPairs] = useState<any[]>([]);
  const [positions, setPositions] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/admin/cex/pairs', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => {
        const items = (d?.data ?? []).map((p: any) => ({
          id: p.id,
          symbol: p.symbol,
          price: 0,
          change: 0,
          leverage: '1x',
          dailyInterest: parseFloat(p.takerFeeRate) * 100 || 0,
          volume: 0,
        }));
        setMarginPairs(items);
        if (items.length > 0) setSelectedPair(items[0].symbol);
      })
      .catch(() => {});

    fetch('/api/admin/cex/positions?status=active&pageSize=50', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setPositions(d?.data?.items ?? []))
      .catch(() => setPositions([]));
  }, []);


  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CreditCardOutlined className="text-2xl text-purple-600" />
            <h1 className="text-2xl font-bold m-0">杠杆交易</h1>
          </div>
          <Space>
            <Button icon={<CalculatorOutlined />}>利息计算器</Button>
            <Button icon={<SyncOutlined />} type="primary">刷新数据</Button>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={8}>
            <Card title="杠杆交易对">
              <Table
                dataSource={marginPairs}
                columns={[
                  { title: '交易对', dataIndex: 'symbol', key: 'symbol', render: (text) => <span className="font-semibold">{text}</span> },
                  { title: '价格', dataIndex: 'price', key: 'price', render: (val) => <span className="font-mono">${val.toLocaleString()}</span> },
                  { 
                    title: '涨跌', 
                    dataIndex: 'change', 
                    key: 'change',
                    render: (val) => <span className={val >= 0 ? 'text-green-600' : 'text-red-600'}>{val >= 0 ? '+' : ''}{val}%</span>
                  },
                  { title: '最大杠杆', dataIndex: 'leverage', key: 'leverage' },
                  { title: '日利率', dataIndex: 'dailyInterest', key: 'dailyInterest', render: (val) => `${val}%` },
                ]}
                pagination={false}
                rowKey="id"
                onRow={(record) => ({
                  onClick: () => setSelectedPair(record.symbol),
                  className: selectedPair === record.symbol ? 'bg-purple-50' : '',
                })}
              />
            </Card>

            <Card title="我的杠杆持仓" size="small">
              {positions.length > 0 ? (
                <Table
                  dataSource={positions}
                  columns={[
                    { title: '交易对', dataIndex: 'symbol', key: 'symbol' },
                    { 
                      title: '方向', 
                      dataIndex: 'side', 
                      key: 'side',
                      render: (val) => <Tag color={val === 'long' ? 'green' : 'red'}>{val === 'long' ? '做多' : '做空'}</Tag>
                    },
                    { title: '杠杆', dataIndex: 'leverage', key: 'leverage' },
                    { title: '数量', dataIndex: 'quantity', key: 'quantity' },
                    { 
                      title: '盈亏', 
                      dataIndex: 'pnl', 
                      key: 'pnl',
                      render: (val) => <span className={val >= 0 ? 'text-green-600' : 'text-red-600'}>${val >= 0 ? '+' : ''}{val.toFixed(2)}</span>
                    },
                    { 
                      title: '盈亏比', 
                      dataIndex: 'pnlPercent', 
                      key: 'pnlPercent',
                      render: (val) => <span className={val >= 0 ? 'text-green-600' : 'text-red-600'}>{val >= 0 ? '+' : ''}{val}%</span>
                    },
                    { 
                      title: '操作', 
                      key: 'action',
                      render: () => <Button type="link" danger>平仓</Button>
                    },
                  ]}
                  pagination={false}
                  rowKey="id"
                  size="small"
                />
              ) : (
                <div className="text-center text-gray-400 py-8">暂无持仓</div>
              )}
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title={`${selectedPair} 价格走势`}>
              <SafeECharts option={chartOption} style={{ height: 300 }} title={`${selectedPair} 价格走势`} />
            </Card>

            <Card title="借款记录" size="small">
              <Table
                dataSource={mockLoans}
                columns={[
                  { title: '币种', dataIndex: 'asset', key: 'asset' },
                  { title: '借款金额', dataIndex: 'borrowed', key: 'borrowed', render: (val, record) => `${val} ${record.asset}` },
                  { title: '利率', dataIndex: 'interestRate', key: 'interestRate', render: (val) => `${val}%/日` },
                  { title: '天数', dataIndex: 'days', key: 'days', render: (val) => `${val}天` },
                  { title: '利息', dataIndex: 'interest', key: 'interest', render: (val, record) => `${val} ${record.asset}` },
                  { 
                    title: '状态', 
                    dataIndex: 'status', 
                    key: 'status',
                    render: (val) => <Tag color={val === 'active' ? 'blue' : 'gray'}>{val === 'active' ? '进行中' : '已还清'}</Tag>
                  },
                ]}
                pagination={false}
                rowKey="id"
                size="small"
              />
            </Card>

            <Card title="风险提示" size="small" className="bg-orange-50">
              <div className="flex items-start gap-2">
                <AlertOutlined className="text-orange-500 mt-0.5" />
                <div className="text-sm text-gray-600">
                  <p className="font-semibold text-orange-700">杠杆交易风险提示</p>
                  <p>杠杆交易具有高风险，亏损可能超过保证金。请谨慎操作，合理设置止损。</p>
                </div>
              </div>
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card title={`${selectedPair} 杠杆交易`}>
              <div className="flex gap-2 mb-4">
                <Button 
                  type={side === 'long' ? 'primary' : 'default'} 
                  onClick={() => setSide('long')}
                  className="flex-1"
                >
                  <ArrowUpOutlined /> 做多
                </Button>
                <Button 
                  type={side === 'short' ? 'primary' : 'default'} 
                  danger={side === 'short'}
                  onClick={() => setSide('short')}
                  className="flex-1"
                >
                  <ArrowDownOutlined /> 做空
                </Button>
              </div>

              <Form layout="vertical">
                <Form.Item label="杠杆倍数">
                  <Select value={leverage} onChange={setLeverage} className="w-full">
                    {[2, 3, 5, 10].map((lev) => (
                      <Option key={lev}>{lev}x</Option>
                    ))}
                  </Select>
                </Form.Item>
                <Form.Item label="交易价格 (USDT)">
                  <InputNumber 
                    className="w-full" 
                    value={price}
                    onChange={(value) => setPrice(value || 0)}
                    step={0.1}
                    prefix="$"
                  />
                </Form.Item>
                <Form.Item label="数量">
                  <InputNumber 
                    className="w-full" 
                    value={quantity}
                    onChange={(value) => setQuantity(value || 0)}
                    step={0.001}
                    precision={3}
                  />
                </Form.Item>
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex justify-between text-sm mb-1">
                    <span>所需保证金:</span>
                    <span>${((price * quantity) / leverage).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>借款金额:</span>
                    <span>${((price * quantity) * (1 - 1/leverage)).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>日利息:</span>
                    <span>${((price * quantity) * (1 - 1/leverage) * 0.05 / 100).toFixed(4)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>强平价:</span>
                    <span className="text-red-600">${((price * (side === 'long' ? (1 - 0.8/leverage) : (1 + 0.8/leverage)))).toFixed(2)}</span>
                  </div>
                </div>
                <Button 
                  type="primary" 
                  size="large" 
                  className="w-full"
                  danger={side === 'short'}
                >
                  {side === 'long' ? '做多' : '做空'} {selectedPair.split('/')[0]}
                </Button>
              </Form>
            </Card>

            <Card title="账户概览" size="small">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>账户余额</span>
                  <span className="font-semibold">$25,580.00</span>
                </div>
                <div className="flex justify-between">
                  <span>可用余额</span>
                  <span className="font-semibold">$18,250.00</span>
                </div>
                <div className="flex justify-between">
                  <span>已借金额</span>
                  <span className="font-semibold text-orange-600">$10,500.5</span>
                </div>
                <div className="flex justify-between">
                  <span>未付利息</span>
                  <span className="font-semibold text-red-600">$2.38</span>
                </div>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}
