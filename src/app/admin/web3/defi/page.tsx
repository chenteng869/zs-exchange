'use client';

import { useState } from 'react';
import {
  Tabs,
  Card,
  Row,
  Col,
  Statistic,
  Table,
  Tag,
  Button,
  Space,
  Progress,
  Modal,
  message,
  Form,
  Input,
  InputNumber,
  Select,
  Switch,
  Drawer,
  Descriptions,
  Badge,
  Divider,
  Tooltip,
} from 'antd';
import {
  FundOutlined,
  SwapOutlined,
  AccountBookOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  ThunderboltOutlined,
  DollarOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

// 模拟质押池数据
const mockStakingPools = [
  {
    id: 1,
    name: 'GXT - 30天稳定存',
    token: 'GXT',
    tokenAddress: '0x1234...5678',
    apr: 15.8,
    minStake: 100,
    lockPeriod: 30,
    totalStaked: 8500000,
    activeUsers: 2100,
    status: 'active',
    createdAt: '2024-01-10',
    updatedAt: '2024-05-10',
  },
  {
    id: 2,
    name: 'USDT - 灵活存',
    token: 'USDT',
    tokenAddress: '0x9876...5432',
    apr: 8.5,
    minStake: 10,
    lockPeriod: 0,
    totalStaked: 12200000,
    activeUsers: 3200,
    status: 'active',
    createdAt: '2024-01-25',
    updatedAt: '2024-05-09',
  },
  {
    id: 3,
    name: 'ETH - 90天长期存',
    token: 'ETH',
    tokenAddress: '0xabc...def',
    apr: 12.3,
    minStake: 0.1,
    lockPeriod: 90,
    totalStaked: 7800000,
    activeUsers: 1200,
    status: 'active',
    createdAt: '2024-02-15',
    updatedAt: '2024-05-08',
  },
  {
    id: 4,
    name: 'BNB - 365天尊享存',
    token: 'BNB',
    tokenAddress: '0x111...222',
    apr: 18.5,
    minStake: 1,
    lockPeriod: 365,
    totalStaked: 5200000,
    activeUsers: 850,
    status: 'paused',
    createdAt: '2024-03-01',
    updatedAt: '2024-04-25',
  },
];

// 模拟流动性池数据
const mockLiquidityPools = [
  {
    id: 1,
    name: 'GXT/USDT',
    token0: 'GXT',
    token1: 'USDT',
    fee: 0.3,
    tvl: 15500000,
    volume24h: 820000,
    apr: 15.2,
    status: 'active',
    contractAddress: '0xpool...111',
  },
  {
    id: 2,
    name: 'ETH/USDT',
    token0: 'ETH',
    token1: 'USDT',
    fee: 0.2,
    tvl: 8900000,
    volume24h: 1250000,
    apr: 12.8,
    status: 'active',
    contractAddress: '0xpool...222',
  },
  {
    id: 3,
    name: 'BNB/USDT',
    token0: 'BNB',
    token1: 'USDT',
    fee: 0.3,
    tvl: 6500000,
    volume24h: 420000,
    apr: 8.5,
    status: 'active',
    contractAddress: '0xpool...333',
  },
];

// 模拟收益发放记录
const mockRewardRecords = [
  { id: 1, pool: 'GXT - 30天', user: 'user001', amount: 125.5, token: 'USDT', status: 'success', time: '2024-05-10 08:30' },
  { id: 2, pool: 'USDT - 灵活存', user: 'user002', amount: 85.2, token: 'USDT', status: 'success', time: '2024-05-10 08:25' },
  { id: 3, pool: 'ETH - 90天', user: 'user003', amount: 0.015, token: 'ETH', status: 'pending', time: '2024-05-10 08:20' },
  { id: 4, pool: 'GXT - 30天', user: 'user004', amount: 56.8, token: 'USDT', status: 'success', time: '2024-05-10 08:15' },
  { id: 5, pool: 'USDT - 灵活存', user: 'user005', amount: 1200.0, token: 'USDT', status: 'success', time: '2024-05-10 08:10' },
];

// 质押趋势图表
const stakingTrendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['质押总量', '活跃用户'] },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: [
    { type: 'value', name: '质押量' },
    { type: 'value', name: '用户数' },
  ],
  series: [
    {
      name: '质押总量',
      type: 'line',
      smooth: true,
      data: [25000000, 27000000, 26500000, 28000000, 30000000, 29500000, 33700000],
    },
    {
      name: '活跃用户',
      type: 'line',
      yAxisIndex: 1,
      smooth: true,
      data: [6200, 6500, 6300, 6800, 7000, 6900, 7350],
    },
  ],
};

export default function DeFiPage() {
  const [activeTab, setActiveTab] = useState('staking');
  const [poolDrawerVisible, setPoolDrawerVisible] = useState(false);
  const [selectedPool, setSelectedPool] = useState<any>(null);
  const [drawerType, setDrawerType] = useState<'staking' | 'liquidity' | null>(null);

  // 质押池表格列
  const stakingColumns = [
    {
      title: '质押池',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: any) => (
        <div>
          <div className="font-semibold">{text}</div>
          <div className="text-xs text-gray-400">锁定期: {record.lockPeriod} 天</div>
        </div>
      ),
    },
    { title: '代币', dataIndex: 'token', key: 'token', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '年化收益', dataIndex: 'apr', key: 'apr', render: (val: number) => <span className="text-green-600 font-semibold">{val}%</span> },
    { title: '最低质押', dataIndex: 'minStake', key: 'minStake' },
    {
      title: '质押总量',
      dataIndex: 'totalStaked',
      key: 'totalStaked',
      render: (val: number) => `$${(val / 1000000).toFixed(2)}M`,
    },
    {
      title: '参与用户',
      dataIndex: 'activeUsers',
      key: 'activeUsers',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge
          status={status === 'active' ? 'success' : status === 'paused' ? 'warning' : 'default'}
          text={status === 'active' ? '运行中' : status === 'paused' ? '已暂停' : '已下线'}
        />
      ),
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => {
            setSelectedPool(record);
            setDrawerType('staking');
            setPoolDrawerVisible(true);
          }}>详情</Button>
          <Button size="small" type="primary" icon={<EditOutlined />}>编辑</Button>
        </Space>
      ),
    },
  ];

  // 流动性池表格列
  const liquidityColumns = [
    { title: '交易对', dataIndex: 'name', key: 'name', render: (text: string) => <div className="font-semibold">{text}</div> },
    { title: '手续费', dataIndex: 'fee', key: 'fee', render: (val: number) => `${val}%` },
    { title: 'TVL', dataIndex: 'tvl', key: 'tvl', render: (val: number) => `$${(val / 1000000).toFixed(2)}M` },
    { title: '24h 交易量', dataIndex: 'volume24h', key: 'volume24h', render: (val: number) => `$${(val / 1000000).toFixed(2)}M` },
    { title: 'APR', dataIndex: 'apr', key: 'apr', render: (val: number) => <span className="text-green-600 font-semibold">{val}%</span> },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Badge status={status === 'active' ? 'success' : 'default'} text={status === 'active' ? '正常' : '暂停'} />,
    },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          <Button size="small" icon={<EyeOutlined />} onClick={() => {
            setSelectedPool(record);
            setDrawerType('liquidity');
            setPoolDrawerVisible(true);
          }}>详情</Button>
          <Button size="small" type="primary" icon={<EditOutlined />}>编辑</Button>
        </Space>
      ),
    },
  ];

  // 收益发放表格列
  const rewardColumns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: '质押池', dataIndex: 'pool', key: 'pool' },
    { title: '用户', dataIndex: 'user', key: 'user' },
    { title: '发放金额', dataIndex: 'amount', key: 'amount', render: (val: number, record: any) => `${val} ${record.token}` },
    { title: '状态', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'success' ? 'green' : 'blue'}>{status === 'success' ? '已发放' : '处理中'}</Tag> },
    { title: '时间', dataIndex: 'time', key: 'time' },
    {
      title: '操作',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space>
          {record.status !== 'success' && <Button size="small" type="primary" onClick={() => message.success('已手动发放')}>发放</Button>}
          <Button size="small" type="text">查看详情</Button>
        </Space>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'staking',
      label: <span className="flex items-center gap-2"><FundOutlined /> 质押池管理</span>,
    },
    {
      key: 'liquidity',
      label: <span className="flex items-center gap-2"><SwapOutlined /> 流动性池</span>,
    },
    {
      key: 'rewards',
      label: <span className="flex items-center gap-2"><AccountBookOutlined /> 收益分配</span>,
    },
  ];

  // 计算总指标
  const totalStakingTVL = mockStakingPools.reduce((sum, pool) => sum + pool.totalStaked, 0);
  const totalLiquidityTVL = mockLiquidityPools.reduce((sum, pool) => sum + pool.tvl, 0);
  const totalActiveUsers = mockStakingPools.reduce((sum, pool) => sum + pool.activeUsers, 0);
  const avgAPR = (mockStakingPools.reduce((sum, pool) => sum + pool.apr, 0) / mockStakingPools.length).toFixed(1);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <ThunderboltOutlined className="text-2xl text-green-600" />
          <h1 className="text-2xl font-bold m-0">DeFi 功能管理</h1>
        </div>

        {/* 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="总质押规模"
                value={totalStakingTVL}
                prefix={<FundOutlined />}
                precision={0}
                formatter={(val) => `$${(Number(val) / 1000000).toFixed(2)}M`}
              />
              <div className="text-gray-400 text-sm mt-1">较上周 +5.2%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="流动性TVL"
                value={totalLiquidityTVL}
                prefix={<SwapOutlined />}
                precision={0}
                formatter={(val) => `$${(Number(val) / 1000000).toFixed(2)}M`}
              />
              <div className="text-gray-400 text-sm mt-1">较上周 +3.8%</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="活跃用户"
                value={totalActiveUsers}
                prefix={<CheckCircleOutlined />}
                precision={0}
              />
              <div className="text-gray-400 text-sm mt-1">今日新增 85</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="平均APR"
                value={Number(avgAPR)}
                suffix="%"
                valueStyle={{ color: '#3f8600' }}
              />
              <div className="text-gray-400 text-sm mt-1">最高 {Math.max(...mockStakingPools.map(p => p.apr))}%</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={16}>
            <Card title="质押趋势">
              <SafeECharts option={stakingTrendOption} style={{ height: 300 }} title="质押趋势" />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card title="TVL 分布">
              {mockStakingPools.map((pool) => (
                <div key={pool.id} className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium">{pool.name}</span>
                    <span className="text-gray-500">${(pool.totalStaked / 1000000).toFixed(1)}M</span>
                  </div>
                  <Progress
                    percent={Math.round((pool.totalStaked / totalStakingTVL) * 100)}
                    size="small"
                    status={pool.status === 'active' ? 'active' : 'exception'}
                  />
                </div>
              ))}
            </Card>
          </Col>
        </Row>

        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

        <Card className="mt-4">
          {activeTab === 'staking' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium">质押池列表</span>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                  setSelectedPool(null);
                  setDrawerType('staking');
                  setPoolDrawerVisible(true);
                }}>新增质押池</Button>
              </div>
              <Table dataSource={mockStakingPools} columns={stakingColumns} rowKey="id" />
            </div>
          )}

          {activeTab === 'liquidity' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium">流动性池列表</span>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => {
                  setSelectedPool(null);
                  setDrawerType('liquidity');
                  setPoolDrawerVisible(true);
                }}>新增流动性池</Button>
              </div>
              <Table dataSource={mockLiquidityPools} columns={liquidityColumns} rowKey="id" />
            </div>
          )}

          {activeTab === 'rewards' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-medium">收益发放记录</span>
                <Space>
                  <Button>批量发放</Button>
                  <Button type="primary" icon={<PlusOutlined />}>手动发放</Button>
                </Space>
              </div>
              <Table dataSource={mockRewardRecords} columns={rewardColumns} rowKey="id" />
            </div>
          )}
        </Card>

        <Drawer
          title={selectedPool ? (drawerType === 'staking' ? '质押池详情' : '流动性池详情') : (drawerType === 'staking' ? '新增质押池' : '新增流动性池')}
          width={600}
          open={poolDrawerVisible}
          onClose={() => setPoolDrawerVisible(false)}
          footer={
            <div className="flex justify-end gap-2">
              <Button onClick={() => setPoolDrawerVisible(false)}>取消</Button>
              <Button type="primary" onClick={() => { message.success(selectedPool ? '更新成功' : '创建成功'); setPoolDrawerVisible(false); }}>
                {selectedPool ? '保存' : '创建'}
              </Button>
            </div>
          }
        >
          {selectedPool && drawerType === 'staking' && (
            <div className="space-y-4">
              <Descriptions bordered column={1}>
                <Descriptions.Item label="名称">{selectedPool.name}</Descriptions.Item>
                <Descriptions.Item label="代币">{selectedPool.token}</Descriptions.Item>
                <Descriptions.Item label="合约地址"><span className="font-mono">{selectedPool.tokenAddress}</span></Descriptions.Item>
                <Descriptions.Item label="年化APR"><span className="text-green-600 font-semibold">{selectedPool.apr}%</span></Descriptions.Item>
                <Descriptions.Item label="最低质押">{selectedPool.minStake} {selectedPool.token}</Descriptions.Item>
                <Descriptions.Item label="锁定期">{selectedPool.lockPeriod} 天</Descriptions.Item>
                <Descriptions.Item label="总质押量">${(selectedPool.totalStaked / 1000000).toFixed(2)}M</Descriptions.Item>
                <Descriptions.Item label="参与用户">{selectedPool.activeUsers.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="状态"><Badge status={selectedPool.status === 'active' ? 'success' : 'warning'} text={selectedPool.status === 'active' ? '运行中' : '已暂停'} /></Descriptions.Item>
              </Descriptions>
              <Divider />
              <h4 className="font-semibold">配置编辑</h4>
              <Form layout="vertical">
                <Form.Item label="年化APR"><InputNumber style={{ width: '100%' }} defaultValue={selectedPool.apr} /></Form.Item>
                <Form.Item label="最低质押"><InputNumber style={{ width: '100%' }} defaultValue={selectedPool.minStake} /></Form.Item>
                <Form.Item label="状态" valuePropName="checked"><Switch defaultChecked={selectedPool.status === 'active'} /></Form.Item>
              </Form>
            </div>
          )}
        </Drawer>
      </div>
    </AdminLayout>
  );
}
