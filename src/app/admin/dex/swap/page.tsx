'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Form, Input, InputNumber, Select, Statistic, Badge, Modal } from 'antd';
import { SwapOutlined, ArrowUpOutlined, ArrowDownOutlined, HistoryOutlined, EyeOutlined, DownloadOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const { Option } = Select;

// 模拟交易对数据
const mockPairs = [
  { id: '1', name: 'GXT/USDT', tokenA: 'GXT', tokenB: 'USDT', price: 0.8523, change24h: 2.56, volume24h: 1250000, liquidity: 8500000, active: true },
  { id: '2', name: 'ETH/USDT', tokenA: 'ETH', tokenB: 'USDT', price: 3285.50, change24h: -1.23, volume24h: 3200000, liquidity: 15200000, active: true },
  { id: '3', name: 'BTC/USDT', tokenA: 'BTC', tokenB: 'USDT', price: 67523.80, change24h: 0.85, volume24h: 2800000, liquidity: 12800000, active: true },
  { id: '4', name: 'BNB/USDT', tokenA: 'BNB', tokenB: 'USDT', price: 612.35, change24h: -0.45, volume24h: 850000, liquidity: 4200000, active: true },
];

// 模拟交易记录
const mockSwapTransactions = [
  { id: '1', user: '0x1234...5678', pair: 'GXT/USDT', from: 'GXT', to: 'USDT', amountFrom: 1000, amountTo: 850, fee: 2.55, status: 'success', time: '2024-05-13 14:32:15' },
  { id: '2', user: '0xabc1...def2', pair: 'ETH/USDT', from: 'ETH', to: 'USDT', amountFrom: 0.5, amountTo: 1642.75, fee: 4.93, status: 'success', time: '2024-05-13 14:31:42' },
  { id: '3', user: '0x9876...5432', pair: 'BTC/USDT', from: 'USDT', to: 'BTC', amountFrom: 1000, amountTo: 0.0148, fee: 3, status: 'pending', time: '2024-05-13 14:30:18' },
  { id: '4', user: '0x1111...2222', pair: 'BNB/USDT', from: 'BNB', to: 'USDT', amountFrom: 10, amountTo: 6123.50, fee: 18.37, status: 'success', time: '2024-05-13 14:28:55' },
  { id: '5', user: '0x3333...4444', pair: 'ETH/USDT', from: 'USDT', to: 'ETH', amountFrom: 500, amountTo: 0.152, fee: 1.5, status: 'failed', time: '2024-05-13 14:26:32' },
];

// 交易量趋势图表
const volumeTrendOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
  yAxis: { type: 'value' },
  series: [
    { type: 'bar', data: [1.2, 0.8, 1.5, 2.1, 1.8, 2.5, 1.2], itemStyle: { color: '#1677FF' }, name: '交易量(M)' },
  ],
};

export default function DexSwapPage() {
  const [selectedPair, setSelectedPair] = useState('GXT/USDT');
  const [pairToView, setPairToView] = useState<any>(null);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);

  const swapColumns = [
    { title: '交易用户', dataIndex: 'user', key: 'user', width: 130 },
    { title: '交易对', dataIndex: 'pair', key: 'pair', width: 120 },
    { 
      title: '交易方向', 
      key: 'direction', 
      width: 100, 
      render: (_: any, record: any) => (
        <Tag color={record.from === 'USDT' ? 'green' : 'blue'}>
          {record.from} → {record.to}
        </Tag>
      ),
    },
    { title: '发送数量', dataIndex: 'amountFrom', key: 'amountFrom', render: (val: number, rec: any) => `${val} ${rec.from}` },
    { title: '接收数量', dataIndex: 'amountTo', key: 'amountTo', render: (val: number, rec: any) => `${val} ${rec.to}` },
    { title: '手续费', dataIndex: 'fee', key: 'fee', render: (val: number) => `$${val.toFixed(2)}` },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const colors: Record<string, 'success' | 'processing' | 'error'> = { success: 'success', pending: 'processing', failed: 'error' };
        const labels: Record<string, string> = { success: '成功', pending: '处理中', failed: '失败' };
        return <Badge status={colors[status]} text={labels[status]} />;
      },
    },
    { title: '时间', dataIndex: 'time', key: 'time', width: 180 },
    { 
      title: '操作', 
      key: 'action', 
      render: (_: any, record: any) => <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>详情</Button>,
    },
  ];

  const pairColumns = [
    { 
      title: '交易对', 
      dataIndex: 'name', 
      key: 'name', 
      render: (text: string) => <span className="font-semibold text-blue-600">{text}</span>,
    },
    { title: '当前价格', dataIndex: 'price', key: 'price', render: (val: number) => `$${val.toLocaleString()}` },
    { 
      title: '24h涨跌幅', 
      dataIndex: 'change24h', 
      key: 'change24h', 
      render: (val: number) => (
        <span className={val >= 0 ? 'text-green-600' : 'text-red-600'}>
          {val >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {val >= 0 ? '+' : ''}{val}%
        </span>
      ),
    },
    { title: '24h交易量', dataIndex: 'volume24h', key: 'volume24h', render: (val: number) => `$${(val / 1000000).toFixed(2)}M` },
    { title: '流动性', dataIndex: 'liquidity', key: 'liquidity', render: (val: number) => `$${(val / 1000000).toFixed(2)}M` },
    { 
      title: '状态', 
      dataIndex: 'active', 
      key: 'active', 
      render: (val: boolean) => <Tag color={val ? 'green' : 'red'}>{val ? '活跃' : '暂停'}</Tag>,
    },
  ];

  const handleViewDetail = (record: any) => {
    setPairToView(record);
    setIsViewModalVisible(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <SwapOutlined className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold m-0">闪兑交易</h1>
          </div>
          <Space>
            <Button icon={<HistoryOutlined />}>历史记录</Button>
            <Button type="primary" icon={<DownloadOutlined />}>导出数据</Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="24h交易总量"
                value={8.82}
                precision={2}
                prefix="$"
                suffix="M"
                valueStyle={{ color: '#3f8600' }}
              />
              <div className="text-green-500 text-sm mt-2">
                <ArrowUpOutlined /> +12.5% (24h)
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="24h交易笔数"
                value={5432}
                valueStyle={{ color: '#1677FF' }}
              />
              <div className="text-green-500 text-sm mt-2">
                <ArrowUpOutlined /> +8.3% (24h)
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="活跃交易对"
                value={4}
                valueStyle={{ color: '#7C3AED' }}
              />
              <div className="text-gray-400 text-sm mt-2">
                总交易对: 12
              </div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="24h手续费收入"
                value={26.46}
                precision={2}
                prefix="$"
                suffix="K"
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="text-red-500 text-sm mt-2">
                <ArrowDownOutlined /> -2.1% (24h)
              </div>
            </Card>
          </Col>
        </Row>

        {/* 交易量趋势图 */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card title="24h交易量趋势">
              <SafeECharts option={volumeTrendOption} style={{ height: 300 }} title="24h交易量趋势" />
            </Card>
          </Col>
        </Row>

        {/* 交易对统计 */}
        <Card title="交易对统计">
          <Table
            dataSource={mockPairs}
            columns={pairColumns}
            pagination={false}
            rowKey="id"
          />
        </Card>

        {/* 交易记录 */}
        <Card title="最近交易记录">
          <Row gutter={[16, 16]} className="mb-4">
            <Col xs={24} sm={8}>
              <Select value={selectedPair} onChange={setSelectedPair} style={{ width: '100%' }} placeholder="选择交易对">
                {mockPairs.map(pair => <Option key={pair.id} value={pair.name}>{pair.name}</Option>)}
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Select style={{ width: '100%' }} placeholder="筛选状态">
                <Option value="all">全部状态</Option>
                <Option value="success">成功</Option>
                <Option value="pending">处理中</Option>
                <Option value="failed">失败</Option>
              </Select>
            </Col>
            <Col xs={24} sm={8}>
              <Input.Search placeholder="搜索用户地址" />
            </Col>
          </Row>
          <Table
            dataSource={mockSwapTransactions}
            columns={swapColumns}
            pagination={{ pageSize: 10 }}
            rowKey="id"
          />
        </Card>

        {/* 详情模态框 */}
        <Modal
          title="交易详情"
          open={isViewModalVisible}
          onCancel={() => setIsViewModalVisible(false)}
          footer={null}
        >
          {pairToView && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-gray-500">交易用户:</span>
                <span className="font-mono">{pairToView.user}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">交易对:</span>
                <span>{pairToView.pair}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">交易方向:</span>
                <span>{pairToView.from} → {pairToView.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">发送数量:</span>
                <span>{pairToView.amountFrom} {pairToView.from}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">接收数量:</span>
                <span>{pairToView.amountTo} {pairToView.to}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">手续费:</span>
                <span>${pairToView.fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">状态:</span>
                <Badge 
                  status={pairToView.status === 'success' ? 'success' : pairToView.status === 'pending' ? 'processing' : 'error'} 
                  text={pairToView.status === 'success' ? '成功' : pairToView.status === 'pending' ? '处理中' : '失败'} 
                />
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">时间:</span>
                <span>{pairToView.time}</span>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
