'use client';

import { useState, useEffect } from 'react';
import {
  Card, Row, Col, Statistic, Table, Tag, Button, Space, Progress, Modal,
  Form, Input, InputNumber, Select, Badge, Drawer, Descriptions, DatePicker,
  Tooltip, Alert, Dropdown, Menu,
} from 'antd';
import {
  SwapOutlined, PlusOutlined, EditOutlined, EyeOutlined, WarningOutlined,
  ArrowUpOutlined, ArrowDownOutlined, DownloadOutlined, FilterOutlined,
  SyncOutlined, ThunderboltOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const mockLiquidityPools = [
  {
    id: '1',
    name: 'GXT-USDT',
    token0: 'GXT',
    token1: 'USDT',
    fee: 0.3,
    tvl: 5800000,
    volume24h: 1250000,
    apr: 18.5,
    status: 'active',
    contractAddress: '0x1a2b3c4d5e6f7g8h9i0j1k2l3m4n5o6p7q8r9s0t1',
    price: 0.85,
    priceChange: 2.5,
    liquidity: { token0: 4500000, token1: 1300000 },
    transactions: 2350,
    lastUpdate: '2024-05-10 08:45:32',
    alerts: [],
  },
  {
    id: '2',
    name: 'ETH-USDT',
    token0: 'ETH',
    token1: 'USDT',
    fee: 0.3,
    tvl: 8200000,
    volume24h: 3500000,
    apr: 12.8,
    status: 'active',
    contractAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    price: 3200,
    priceChange: -1.2,
    liquidity: { token0: 2500, token1: 5700000 },
    transactions: 5820,
    lastUpdate: '2024-05-10 08:45:28',
    alerts: ['高交易量波动'],
  },
  {
    id: '3',
    name: 'BNB-USDT',
    token0: 'BNB',
    token1: 'USDT',
    fee: 0.1,
    tvl: 4500000,
    volume24h: 850000,
    apr: 8.2,
    status: 'warning',
    contractAddress: '0x1111111111111111111111111111111111111111',
    price: 680,
    priceChange: 0.8,
    liquidity: { token0: 5200, token1: 1100000 },
    transactions: 1280,
    lastUpdate: '2024-05-10 08:44:15',
    alerts: ['TVL下降超过20%', '流动性不足警告'],
  },
  {
    id: '4',
    name: 'GXT-ETH',
    token0: 'GXT',
    token1: 'ETH',
    fee: 0.5,
    tvl: 1200000,
    volume24h: 180000,
    apr: 25.6,
    status: 'active',
    contractAddress: '0x2222222222222222222222222222222222222222',
    price: 0.000265,
    priceChange: 5.8,
    liquidity: { token0: 3200000, token1: 850 },
    transactions: 456,
    lastUpdate: '2024-05-10 08:45:35',
    alerts: [],
  },
];

const tvlTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['GXT-USDT', 'ETH-USDT', 'BNB-USDT'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
  yAxis: { type: 'value', axisLabel: { formatter: '{value}万' } },
  series: [
    { name: 'GXT-USDT', type: 'line', smooth: true, data: [520, 545, 568, 592, 585, 572, 580] },
    { name: 'ETH-USDT', type: 'line', smooth: true, data: [780, 795, 810, 825, 818, 812, 820] },
    { name: 'BNB-USDT', type: 'line', smooth: true, data: [520, 505, 485, 465, 458, 452, 450] },
  ],
};

const volumeDistributionOption = {
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left' },
  series: [{
    name: '交易量分布',
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
    label: { show: false, position: 'center' },
    emphasis: { label: { show: true, fontSize: 18, fontWeight: 'bold' } },
    labelLine: { show: false },
    data: [
      { value: 3500000, name: 'ETH-USDT' },
      { value: 1250000, name: 'GXT-USDT' },
      { value: 850000, name: 'BNB-USDT' },
      { value: 180000, name: 'GXT-ETH' },
    ],
  }],
};

const flowHistory = [
  { id: '1', type: 'add', pool: 'GXT-USDT', amount: 50000, token: 'USDT', time: '2024-05-10 08:45:32', txHash: '0xaaa...bbb' },
  { id: '2', type: 'remove', pool: 'ETH-USDT', amount: 2.5, token: 'ETH', time: '2024-05-10 08:45:28', txHash: '0xccc...ddd' },
  { id: '3', type: 'add', pool: 'BNB-USDT', amount: 10000, token: 'USDT', time: '2024-05-10 08:45:15', txHash: '0xeee...fff' },
  { id: '4', type: 'swap', pool: 'GXT-USDT', from: 'GXT', to: 'USDT', amount: 1000, time: '2024-05-10 08:45:08', txHash: '0xggg...hhh' },
  { id: '5', type: 'add', pool: 'GXT-ETH', amount: 50000, token: 'GXT', time: '2024-05-10 08:44:55', txHash: '0xiii...jjj' },
];

export default function LiquidityPage() {
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [filterVisible, setFilterVisible] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => setLastUpdate(new Date()), 300000);
    return () => clearInterval(interval);
  }, []);

  const columns = [
    { title: '交易对', dataIndex: 'name', key: 'name', render: (text: string) => <div className="font-semibold">{text}</div> },
    { title: '手续费', dataIndex: 'fee', key: 'fee', render: (val: number) => `${val}%` },
    { title: 'TVL', dataIndex: 'tvl', key: 'tvl', render: (val: number) => `$${(val / 1000000).toFixed(2)}M` },
    { title: '24h交易量', dataIndex: 'volume24h', key: 'volume24h', render: (val: number) => `$${(val / 1000000).toFixed(2)}M` },
    { title: 'APR', dataIndex: 'apr', key: 'apr', render: (val: number) => <span className="text-green-600">{val}%</span> },
    { title: '价格', dataIndex: 'price', key: 'price', render: (val: number, record: any) => (
      <div>
        <span>${val.toLocaleString()}</span>
        <span className={`ml-2 ${record.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {record.priceChange >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
          {record.priceChange}%
        </span>
      </div>
    ) },
    { title: '24h交易数', dataIndex: 'transactions', key: 'transactions', render: (val: number) => val.toLocaleString() },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => {
      const statusMap: Record<string, { color: 'success' | 'warning' | 'error'; text: string }> = { active: { color: 'success', text: '正常' }, warning: { color: 'warning', text: '警告' }, error: { color: 'error', text: '异常' } };
      return <Badge status={statusMap[status]?.color || 'default'} text={statusMap[status]?.text || status} />;
    } },
    {
      title: '预警', key: 'alerts', render: (_: any, record: any) => {
        if (record.alerts.length === 0) return <Tag color="green">无</Tag>;
        return <Tooltip title={record.alerts.join('\n')}><Tag color="red">{record.alerts.length}条</Tag></Tooltip>;
      },
    },
    {
      title: '操作', key: 'actions', render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => { setSelectedPool(record); setDrawerVisible(true); }}>详情</Button>
          <Button size="small" type="primary" icon={<EditOutlined />}>配置</Button>
        </Space>
      ),
    },
  ];

  const totalTVL = mockLiquidityPools.reduce((sum, pool) => sum + pool.tvl, 0);
  const totalVolume = mockLiquidityPools.reduce((sum, pool) => sum + pool.volume24h, 0);
  const avgAPR = (mockLiquidityPools.reduce((sum, pool) => sum + pool.apr, 0) / mockLiquidityPools.length).toFixed(1);
  const warningCount = mockLiquidityPools.filter(p => p.status === 'warning').length;

  const menu = (
    <Menu>
      <Menu.Item key="1">导出CSV</Menu.Item>
      <Menu.Item key="2">导出Excel</Menu.Item>
      <Menu.Item key="3">导出PDF</Menu.Item>
    </Menu>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <SwapOutlined className="text-2xl text-blue-600" />
            <h1 className="text-2xl font-bold m-0">DeFi 流动性管理</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm flex items-center gap-1">
              <ClockCircleOutlined />
              最后更新: {lastUpdate.toLocaleTimeString()}
            </span>
            <Button icon={<SyncOutlined />}>刷新数据</Button>
            <Button icon={<FilterOutlined />} onClick={() => setFilterVisible(true)}>筛选</Button>
            <Dropdown overlay={menu}>
              <Button icon={<DownloadOutlined />}>导出数据</Button>
            </Dropdown>
            <Button type="primary" icon={<PlusOutlined />}>新增流动性池</Button>
          </div>
        </div>

        {warningCount > 0 && (
          <Alert
            message={`检测到 ${warningCount} 个流动性池存在异常状态`}
            description="请及时查看并处理预警信息"
            type="warning"
            showIcon
            action={<Button size="small">查看详情</Button>}
          />
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="总锁仓量(TVL)" value={totalTVL} prefix="$" precision={0} formatter={(val) => `${(Number(val) / 1000000).toFixed(2)}M`} />
              <div className="text-gray-400 text-sm mt-1">较昨日 +5.2%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="24h交易量" value={totalVolume} prefix="$" precision={0} formatter={(val) => `${(Number(val) / 1000000).toFixed(2)}M`} />
              <div className="text-gray-400 text-sm mt-1">较昨日 +12.8%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="平均APR" value={Number(avgAPR)} suffix="%" valueStyle={{ color: '#3f8600' }} />
              <div className="text-gray-400 text-sm mt-1">最高 {Math.max(...mockLiquidityPools.map(p => p.apr))}%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic title="流动性池" value={mockLiquidityPools.length} suffix={`/ ${warningCount} 警告`} />
              <div className="text-gray-400 text-sm mt-1">全部正常运行</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            <Card title="TVL趋势 (24小时)">
              <SafeECharts option={tvlTrendOption} style={{ height: 280 }} title="TVL趋势" />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card title="交易量分布">
              <SafeECharts option={volumeDistributionOption} style={{ height: 280 }} title="交易量分布" />
            </Card>
          </Col>
        </Row>

        <Card title="流动性池监控">
          <Table
            dataSource={mockLiquidityPools}
            columns={columns}
            pagination={{ showSizeChanger: true, showQuickJumper: true, showTotal: (total) => `共 ${total} 个流动性池` }}
            rowKey="id"
            scroll={{ x: 1000 }}
          />
        </Card>

        <Card title="资金流动追踪">
          <Table
            dataSource={flowHistory}
            columns={[
              { title: '类型', dataIndex: 'type', key: 'type', render: (type: string) => {
                const typeMap = { add: { color: 'green', text: '添加流动性' }, remove: { color: 'red', text: '移除流动性' }, swap: { color: 'blue', text: '兑换' } };
                return <Tag color={typeMap[type as keyof typeof typeMap]?.color}>{typeMap[type as keyof typeof typeMap]?.text}</Tag>;
              } },
              { title: '交易对', dataIndex: 'pool', key: 'pool' },
              { title: '金额/方向', key: 'amount', render: (_: any, record: any) => {
                if (record.type === 'swap') return `${record.amount} ${record.from} → ${record.to}`;
                return `${record.amount} ${record.token}`;
              } },
              { title: '时间', dataIndex: 'time', key: 'time' },
              { title: '交易哈希', dataIndex: 'txHash', key: 'txHash', render: (text: string) => <span className="font-mono text-xs">{text}</span> },
              { title: '操作', key: 'action', render: () => <Button size="small">查看详情</Button> },
            ]}
            pagination={{ pageSize: 5 }}
            rowKey="id"
          />
        </Card>

        <Drawer title="流动性池详情" width={700} open={drawerVisible} onClose={() => setDrawerVisible(false)}>
          {selectedPool && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                    <SwapOutlined className="text-2xl text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedPool.name}</h2>
                    <div className="flex gap-2">
                      <Tag color="blue">{selectedPool.token0}</Tag>
                      <span>-</span>
                      <Tag color="blue">{selectedPool.token1}</Tag>
                    </div>
                  </div>
                </div>
                <Badge status={selectedPool.status === 'active' ? 'success' : 'warning'} text={selectedPool.status === 'active' ? '正常' : '警告'} />
              </div>

              <Descriptions bordered column={2}>
                <Descriptions.Item label="手续费比例">{selectedPool.fee}%</Descriptions.Item>
                <Descriptions.Item label="年化收益率"><span className="text-green-600 font-bold">{selectedPool.apr}%</span></Descriptions.Item>
                <Descriptions.Item label="TVL">${(selectedPool.tvl / 1000000).toFixed(2)}M</Descriptions.Item>
                <Descriptions.Item label="24h交易量">${(selectedPool.volume24h / 1000000).toFixed(2)}M</Descriptions.Item>
                <Descriptions.Item label="当前价格">${selectedPool.price.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="价格变化">
                  <span className={selectedPool.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {selectedPool.priceChange >= 0 ? '+' : ''}{selectedPool.priceChange}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="合约地址" span={2}>
                  <span className="font-mono text-xs break-all">{selectedPool.contractAddress}</span>
                </Descriptions.Item>
                <Descriptions.Item label="流动性构成" span={2}>
                  <div className="flex gap-4">
                    <div>{selectedPool.liquidity.token0.toLocaleString()} {selectedPool.token0}</div>
                    <div>{selectedPool.liquidity.token1.toLocaleString()} {selectedPool.token1}</div>
                  </div>
                </Descriptions.Item>
              </Descriptions>

              {selectedPool.alerts.length > 0 && (
                <div className="p-4 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2 text-red-600 mb-2">
                    <WarningOutlined />
                    <span className="font-semibold">预警信息</span>
                  </div>
                  <ul className="list-disc list-inside">
                    {selectedPool.alerts.map((alert: string, index: number) => (        
                      <li key={index} className="text-sm text-red-500">{alert}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </Drawer>

        <Modal title="筛选条件" open={filterVisible} onCancel={() => setFilterVisible(false)} footer={
          <div className="flex justify-end gap-2">
            <Button onClick={() => setFilterVisible(false)}>重置</Button>
            <Button type="primary" onClick={() => setFilterVisible(false)}>应用筛选</Button>
          </div>
        }>
          <Form layout="vertical">
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="交易对名称">
                  <Input placeholder="搜索交易对" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="状态">
                  <Select options={[{ value: 'all', label: '全部' }, { value: 'active', label: '正常' }, { value: 'warning', label: '警告' }]} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="TVL范围(最小)">
                  <InputNumber placeholder="最小TVL" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="TVL范围(最大)">
                  <InputNumber placeholder="最大TVL" />
                </Form.Item>
              </Col>
              <Col span={24}>
                <Form.Item label="时间范围">
                  <DatePicker.RangePicker className="w-full" />
                </Form.Item>
              </Col>
            </Row>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
