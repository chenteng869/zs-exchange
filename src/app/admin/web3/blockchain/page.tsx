'use client';

import {
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Progress,
  Select,
  Input,
  Alert,
  Badge,
  List,
  Timeline,
  Tooltip,
} from 'antd';
import {
  ThunderboltOutlined,
  ScanOutlined,
  CloudServerOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
  SendOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  UserOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

// 区块链网络数据
const mockBlockchains = [
  {
    id: 'eth',
    name: 'Ethereum',
    chainId: 1,
    rpcUrl: 'https://eth.llamarpc.com',
    blockHeight: 18954203,
    blockTime: '12.5s',
    gasPrice: '28.5',
    gasUnit: 'Gwei',
    status: 'healthy',
    activeNodes: 5,
    totalNodes: 5,
    tps: 15,
    avgBlockTime: 12.5,
    lastBlockTime: '2024-05-10 08:42:15',
  },
  {
    id: 'bsc',
    name: 'BNB Chain',
    chainId: 56,
    rpcUrl: 'https://bsc-dataseed.binance.org',
    blockHeight: 35842102,
    blockTime: '3s',
    gasPrice: '3.2',
    gasUnit: 'Gwei',
    status: 'healthy',
    activeNodes: 3,
    totalNodes: 4,
    tps: 85,
    avgBlockTime: 3.0,
    lastBlockTime: '2024-05-10 08:42:18',
  },
  {
    id: 'polygon',
    name: 'Polygon',
    chainId: 137,
    rpcUrl: 'https://polygon-rpc.com',
    blockHeight: 54821036,
    blockTime: '2.1s',
    gasPrice: '85',
    gasUnit: 'Gwei',
    status: 'warning',
    activeNodes: 2,
    totalNodes: 3,
    tps: 120,
    avgBlockTime: 2.1,
    lastBlockTime: '2024-05-10 08:42:16',
  },
];

// 节点数据
const mockNodes = [
  { id: 'node-1', name: 'ETH Node 01', chain: 'Ethereum', status: 'active', version: 'Geth 1.13.5', peers: 25, uptime: '99.8%', lastPing: '2s ago' },
  { id: 'node-2', name: 'ETH Node 02', chain: 'Ethereum', status: 'active', version: 'Geth 1.13.5', peers: 32, uptime: '99.5%', lastPing: '1s ago' },
  { id: 'node-3', name: 'BSC Node 01', chain: 'BNB Chain', status: 'active', version: 'Geth 1.12.0', peers: 18, uptime: '99.9%', lastPing: '1s ago' },
  { id: 'node-4', name: 'BSC Node 02', chain: 'BNB Chain', status: 'inactive', version: 'Geth 1.12.0', peers: 0, uptime: '85.2%', lastPing: '5m ago' },
  { id: 'node-5', name: 'Polygon Node 01', chain: 'Polygon', status: 'active', version: 'Erigon 2.58.0', peers: 22, uptime: '99.2%', lastPing: '3s ago' },
];

// 交易监控数据
const mockTransactions = [
  { id: '0x1234...5678', type: 'NFT Transfer', chain: 'Ethereum', from: '0xaaa...bbb', to: '0xccc...ddd', status: 'success', time: '5s ago' },
  { id: '0xabcd...efgh', type: 'Token Swap', chain: 'BNB Chain', from: '0x111...222', to: 'Dex Router', status: 'success', time: '10s ago' },
  { id: '0x9876...5432', type: 'Staking', chain: 'Polygon', from: '0x333...444', to: 'Staking Pool', status: 'pending', time: '15s ago' },
  { id: '0x5555...6666', type: 'NFT Mint', chain: 'Ethereum', from: '0x555...666', to: 'Mint Contract', status: 'success', time: '20s ago' },
  { id: '0x7777...8888', type: 'Transfer', chain: 'BNB Chain', from: '0x777...888', to: '0x999...000', status: 'failed', time: '30s ago' },
];

// 区块和Gas图表数据
const gasTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['Ethereum', 'BNB Chain', 'Polygon'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
  yAxis: { type: 'value', name: 'Gas Price (Gwei)' },
  series: [
    {
      name: 'Ethereum',
      type: 'line',
      smooth: true,
      data: [25, 30, 22, 45, 35, 28, 28.5],
    },
    {
      name: 'BNB Chain',
      type: 'line',
      smooth: true,
      data: [3, 4, 2.5, 5, 3.5, 3, 3.2],
    },
    {
      name: 'Polygon',
      type: 'line',
      smooth: true,
      data: [60, 85, 50, 120, 95, 70, 85],
    },
  ],
};

const blockTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['区块数', '交易数'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
  yAxis: [
    { type: 'value', name: '区块数' },
    { type: 'value', name: '交易数' },
  ],
  series: [
    {
      name: '区块数',
      type: 'bar',
      data: [850, 720, 950, 1100, 980, 880, 920],
    },
    {
      name: '交易数',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      data: [12500, 9800, 14500, 18000, 15200, 13000, 13800],
    },
  ],
};

const statusColors = {
  healthy: 'green',
  warning: 'orange',
  error: 'red',
};

const statusTexts = {
  healthy: '正常',
  warning: '警告',
  error: '异常',
};

export default function BlockchainMonitorPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <ScanOutlined className="text-2xl text-blue-600" />
          <h1 className="text-2xl font-bold m-0">区块链监控</h1>
          <Space style={{ marginLeft: 'auto' }}>
            <Select style={{ width: 150 }} placeholder="选择网络" options={[
              { label: '全部网络', value: 'all' },
              { label: 'Ethereum', value: 'eth' },
              { label: 'BNB Chain', value: 'bsc' },
              { label: 'Polygon', value: 'polygon' },
            ]} />
            <Input.Search placeholder="搜索区块/交易" style={{ width: 250 }} />
            <Button icon={<ReloadOutlined />}>刷新</Button>
          </Space>
        </div>

        {/* 网络状态总览 */}
        <Row gutter={[16, 16]}>
          {mockBlockchains.map((chain) => (
            <Col xs={24} md={8} key={chain.id}>
              <Card>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ThunderboltOutlined className="text-xl text-blue-500" />
                    <span className="font-semibold text-lg">{chain.name}</span>
                  </div>
                  <Badge
                    status={chain.status === 'healthy' ? 'success' : chain.status === 'warning' ? 'warning' : 'error'}
                    text={statusTexts[chain.status as keyof typeof statusTexts]}
                  />
                </div>
                <Row gutter={[16, 16]}>
                  <Col span={12}>
                    <Statistic
                      title="区块高度"
                      value={chain.blockHeight}
                      formatter={(val) => Number(val).toLocaleString()}
                      valueStyle={{ color: '#1677FF', fontSize: '20px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="Gas Price"
                      value={Number(chain.gasPrice)}
                      suffix={chain.gasUnit}
                      valueStyle={{ fontSize: '20px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="TPS"
                      value={chain.tps}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title="节点在线"
                      value={chain.activeNodes}
                      suffix={`/ ${chain.totalNodes}`}
                      valueStyle={{ fontSize: '18px' }}
                    />
                  </Col>
                </Row>
                <div className="mt-4 text-sm text-gray-500">
                  <div className="flex justify-between mb-1">
                    <span>最后出块</span>
                    <span className="flex items-center gap-1"><ClockCircleOutlined /> {chain.lastBlockTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>RPC 端点</span>
                    <Tooltip title={chain.rpcUrl}>
                      <span className="font-mono text-xs">{chain.rpcUrl.slice(0, 25)}...</span>
                    </Tooltip>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Gas 价格趋势">
              <SafeECharts option={gasTrendOption} style={{ height: 300 }} title="Gas 价格趋势" />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="区块/交易趋势">
              <SafeECharts option={blockTrendOption} style={{ height: 300 }} title="区块/交易趋势" />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          {/* 节点列表 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <CloudServerOutlined />
                  <span>节点管理</span>
                </div>
              }
              extra={<Button type="primary" icon={<PlusOutlined />}>添加节点</Button>}
            >
              <List
                dataSource={mockNodes}
                renderItem={(node) => (
                  <List.Item
                    actions={[
                      <Button type="text" size="small">重启</Button>,
                      <Button type="text" size="small">配置</Button>,
                      <Button type="text" size="small" danger>移除</Button>,
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            node.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                          }`}
                        >
                          {node.status === 'active' ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                        </div>
                      }
                      title={
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{node.name}</span>
                          <Tag color="blue">{node.chain}</Tag>
                        </div>
                      }
                      description={
                        <div className="text-xs text-gray-500">
                          <div>版本: {node.version} | Peers: {node.peers}</div>
                          <div>运行时间: {node.uptime} | 最后心跳: {node.lastPing}</div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          {/* 最新交易 */}
          <Col xs={24} lg={12}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <SendOutlined />
                  <span>最新交易监控</span>
                </div>
              }
              extra={<Button type="text">查看全部</Button>}
            >
              <List
                dataSource={mockTransactions}
                renderItem={(tx) => (
                  <List.Item>
                    <List.Item.Meta
                      avatar={
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.status === 'success' ? 'bg-green-100 text-green-600' :
                            tx.status === 'pending' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'
                          }`}
                        >
                          {tx.status === 'success' ? <CheckCircleOutlined /> :
                           tx.status === 'pending' ? <ClockCircleOutlined /> : <CloseCircleOutlined />}
                        </div>
                      }
                      title={
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{tx.type}</span>
                            <Tag>{tx.chain}</Tag>
                          </div>
                          <Tag color={tx.status === 'success' ? 'green' : tx.status === 'pending' ? 'blue' : 'red'}>
                            {tx.status === 'success' ? '成功' : tx.status === 'pending' ? '处理中' : '失败'}
                          </Tag>
                        </div>
                      }
                      description={
                        <div className="text-xs text-gray-500">
                          <div>
                            <UserOutlined /> {tx.from.slice(0, 8)} → {tx.to.slice(0, 8)}
                          </div>
                          <div className="mt-1">
                            Tx: <span className="font-mono">{tx.id.slice(0, 12)}...</span>
                            <span className="ml-4">{tx.time}</span>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        <Alert
          message="系统提示"
          description="
            此为区块链监控面板，支持多链实时监控、节点管理、交易追踪。如需添加新链或节点，请联系技术团队。
          "
          type="info"
          showIcon
          className="mt-4"
        />
      </div>
    </AdminLayout>
  );
}
