'use client';

import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, List, Progress, Badge, Tag, Statistic, Table } from 'antd';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';
import {
  ThunderboltOutlined,
  AppstoreOutlined,
  FundOutlined,
  ScanOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  DollarOutlined,
  UserOutlined,
} from '@ant-design/icons';

// 模拟数据
const mockWeb3Stats = {
  totalTVL: 56800000,
  totalUsers: 25800,
  activeDApps: 12,
  activeStakingPools: 8,
  stakingVolume: 28500000,
  liquidityVolume: 32400000,
  totalRewards: 1250000,
  chainTransactions: 85400,
  avgAPR: 12.8,
};

// DApp 数据排行
const mockDAppRanking = [
  { id: 1, name: '国学NFT交易平台', category: 'NFT', users: 8520, volume: 15800000, status: 'active' },
  { id: 2, name: 'TokenSwapDEX', category: 'DeFi', users: 5800, volume: 12500000, status: 'active' },
  { id: 3, name: 'ChainStaking', category: 'Staking', users: 3200, volume: 8900000, status: 'active' },
  { id: 4, name: 'Web3内容生态', category: 'Content', users: 2100, volume: 4200000, status: 'active' },
  { id: 5, name: 'GameFi游戏', category: 'GameFi', users: 1850, volume: 2800000, status: 'pending' },
];

// 质押池数据
const mockStakingPools = [
  { id: 1, name: 'GXT - 30天', token: 'GXT', apr: 15.8, tvl: 8500000, users: 2100, status: 'active' },
  { id: 2, name: 'USDT - 灵活存', token: 'USDT', apr: 8.5, tvl: 12200000, users: 3200, status: 'active' },
  { id: 3, name: 'ETH - 90天', token: 'ETH', apr: 12.3, tvl: 7800000, users: 1200, status: 'active' },
];

// 区块链状态
const mockBlockchainStatus = [
  { chain: 'Ethereum', blockHeight: 18954203, gasPrice: '28.5', status: 'healthy' },
  { chain: 'BNB Chain', blockHeight: 35842102, gasPrice: '3.2', status: 'healthy' },
  { chain: 'Polygon', blockHeight: 54821036, gasPrice: '85', status: 'healthy' },
];

// TVL 趋势图表配置
const tvlTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['总TVL', '质押TVL', '流动性TVL'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value', scale: true },
  series: [
    {
      name: '总TVL',
      type: 'line',
      smooth: true,
      data: [48000000, 51000000, 49500000, 52500000, 55000000, 54200000, 56800000],
    },
    {
      name: '质押TVL',
      type: 'line',
      smooth: true,
      data: [24000000, 25800000, 24900000, 26500000, 27800000, 27500000, 28500000],
    },
    {
      name: '流动性TVL',
      type: 'line',
      smooth: true,
      data: [24000000, 25200000, 24600000, 26000000, 27200000, 26700000, 28300000],
    },
  ],
};

// DApp 分类图表
const dappCategoryOption = {
  tooltip: { trigger: 'item' },
  legend: { orient: 'vertical', left: 'left' },
  series: [
    {
      name: 'DApp 分类',
      type: 'pie',
      radius: ['40%', '70%'],
      data: [
        { value: 4, name: 'NFT' },
        { value: 3, name: 'DeFi' },
        { value: 2, name: 'GameFi' },
        { value: 2, name: 'Content' },
        { value: 1, name: 'SocialFi' },
      ],
    },
  ],
};

// DApp 表格列
const dappColumns = [
  {
    title: 'DApp 名称',
    dataIndex: 'name',
    key: 'name',
    render: (text: string, record: any) => (
      <div className="flex items-center gap-2">
        <AppstoreOutlined className="text-purple-500" />
        <span className="font-medium">{text}</span>
      </div>
    ),
  },
  { title: '分类', dataIndex: 'category', key: 'category', render: (cat: string) => <Tag color="blue">{cat}</Tag> },
  { title: '用户数', dataIndex: 'users', key: 'users', render: (val: number) => val.toLocaleString() },
  { title: '交易额', dataIndex: 'volume', key: 'volume', render: (val: number) => `$${(val / 1000000).toFixed(2)}M` },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => (
      <Badge
        status={status === 'active' ? 'success' : status === 'pending' ? 'warning' : 'default'}
        text={status === 'active' ? '运行中' : status === 'pending' ? '审核中' : '已下线'}
      />
    ),
  },
];

export default function Web3DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['web3-dashboard-stats'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 500));
      return mockWeb3Stats;
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <ThunderboltOutlined className="text-2xl text-purple-600" />
          <h1 className="text-2xl font-bold m-0">Web3.0 数据看板</h1>
        </div>

        {/* 核心指标卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm">
              <Statistic
                title="总TVL"
                value={stats?.totalTVL || 0}
                prefix={<DollarOutlined />}
                precision={0}
                valueStyle={{ color: '#3f8600' }}
              />
              <div className="text-gray-400 text-sm mt-1">较上周 +8.5%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm">
              <Statistic
                title="活跃用户"
                value={stats?.totalUsers || 0}
                prefix={<UserOutlined />}
                precision={0}
                valueStyle={{ color: '#1677FF' }}
              />
              <div className="text-gray-400 text-sm mt-1">日活 5,820</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm">
              <Statistic
                title="质押规模"
                value={stats?.stakingVolume || 0}
                prefix={<FundOutlined />}
                precision={0}
                valueStyle={{ color: '#7C3AED' }}
              />
              <div className="text-gray-400 text-sm mt-1">平均 APR: {stats?.avgAPR}%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm">
              <Statistic
                title="链上交易"
                value={stats?.chainTransactions || 0}
                prefix={<ScanOutlined />}
                precision={0}
                valueStyle={{ color: '#F59E0B' }}
              />
              <div className="text-gray-400 text-sm mt-1">今日 +12.3%</div>
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="TVL 增长趋势" className="shadow-sm">
              <SafeECharts option={tvlTrendOption} style={{ height: 350 }} title="TVL 增长趋势" />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="DApp 分类分布" className="shadow-sm">
              <SafeECharts option={dappCategoryOption} style={{ height: 350 }} title="DApp 分类分布" />
            </Card>
          </Col>
        </Row>

        {/* DApp 排行和质押池 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <AppstoreOutlined />
                  <span>DApp 排行</span>
                </div>
              }
              className="shadow-sm"
            >
              <Table
                dataSource={mockDAppRanking}
                columns={dappColumns}
                pagination={false}
                rowKey="id"
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <FundOutlined />
                  <span>质押池概览</span>
                </div>
              }
              className="shadow-sm"
            >
              <List
                dataSource={mockStakingPools}
                renderItem={(item) => (
                  <List.Item className="border-b pb-3">
                    <div className="w-full">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-semibold">{item.name}</span>
                        <Tag color={item.status === 'active' ? 'green' : 'default'}>
                          {item.status === 'active' ? '活跃' : '暂停'}
                        </Tag>
                      </div>
                      <div className="flex justify-between items-center text-sm text-gray-500 mb-2">
                        <span>TVL: ${(item.tvl / 1000000).toFixed(1)}M</span>
                        <span className="text-green-600 font-medium">APR: {item.apr}%</span>
                      </div>
                      <Progress percent={65 + item.id * 5} size="small" status="active" />
                      <div className="mt-1 text-xs text-gray-400">{item.users} 用户参与</div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>

        {/* 区块链状态 */}
        <Row gutter={[16, 16]}>
          <Col xs={24}>
            <Card
              title={
                <div className="flex items-center gap-2">
                  <ScanOutlined />
                  <span>区块链网络状态</span>
                </div>
              }
              className="shadow-sm"
            >
              <List
                grid={{ gutter: 16, column: 3 }}
                dataSource={mockBlockchainStatus}
                renderItem={(item) => (
                  <List.Item>
                    <Card>
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircleOutlined className="text-green-500" />
                        <span className="font-semibold">{item.chain}</span>
                      </div>
                      <div className="text-sm text-gray-500">
                        <div>区块高度: {item.blockHeight.toLocaleString()}</div>
                        <div>Gas Price: {item.gasPrice} Gwei</div>
                      </div>
                      <div className="mt-2">
                        <Badge status="success" text="网络正常" />
                      </div>
                    </Card>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}
