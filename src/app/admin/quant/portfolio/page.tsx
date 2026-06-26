'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Button, Space, Tag, Modal, message, Descriptions, Select, Table, Card, Tooltip, Progress, Row, Col } from 'antd';
import {
  PieChartOutlined,
  EyeOutlined,
  SyncOutlined,
  EditOutlined,
  StopOutlined,
  FileTextOutlined,
  DashboardOutlined,
  DollarOutlined,
  ThunderboltOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface Position {
  symbol: string;
  weight: number;
  value: number;
  pnl: number;
  shares: number;
}

interface Portfolio {
  id: string;
  portfolioName: string;
  strategy: string;
  totalValue: number;
  cashRatio: number;
  positions: Position[];
  dailyPnl: number;
  mtdPnl: number;
  ytdPnl: number;
  volatility: number;
  sharpeRatio: number;
  beta: number;
  maxDrawdown: number;
  var95: number;
  rebalanceFreq: 'daily' | 'weekly' | 'monthly';
  lastRebalanced: string;
  status: 'active' | 'rebalancing' | 'closed';
}

const mockData: Portfolio[] = [
  {
    id: '1', portfolioName: '稳健增长组合A', strategy: '多因子均衡',
    totalValue: 2500000, cashRatio: 8.5,
    positions: [
      { symbol: 'BTC', weight: 35, value: 875000, pnl: 12.5, shares: 13.2 },
      { symbol: 'ETH', weight: 25, value: 625000, pnl: 8.3, shares: 185 },
      { symbol: 'SOL', weight: 15, value: 375000, pnl: -3.2, shares: 2450 },
      { symbol: 'USDT', weight: 8.5, value: 212500, pnl: 0, shares: 212500 },
    ],
    dailyPnl: 12500, mtdPnl: 68000, ytdPnl: 18.5, volatility: 14.2, sharpeRatio: 1.85, beta: 0.82, maxDrawdown: -8.5, var95: 45000, rebalanceFreq: 'weekly', lastRebalanced: '2024-06-20', status: 'active',
  },
  {
    id: '2', portfolioName: '激进增长组合B', strategy: '动量驱动',
    totalValue: 1800000, cashRatio: 2.1,
    positions: [
      { symbol: 'BTC', weight: 45, value: 810000, pnl: 18.7, shares: 12.2 },
      { symbol: 'SOL', weight: 30, value: 540000, pnl: 25.4, shares: 3530 },
      { symbol: 'AVAX', weight: 15, value: 270000, pnl: -8.9, shares: 4200 },
      { symbol: 'DOGE', weight: 7.9, value: 142200, pnl: 42.1, shares: 892000 },
    ],
    dailyPnl: 28500, mtdPnl: 125000, ytdPnl: 32.8, volatility: 28.5, sharpeRatio: 1.42, beta: 1.35, maxDrawdown: -18.2, var95: 72000, rebalanceFreq: 'daily', lastRebalanced: '2024-06-23', status: 'active',
  },
  {
    id: '3', portfolioName: '保守收益组合C', strategy: '套利增强',
    totalValue: 5200000, cashRatio: 25.0,
    positions: [
      { symbol: 'USDC', weight: 20, value: 1040000, pnl: 0.05, shares: 1040000 },
      { symbol: 'BTC', weight: 30, value: 1560000, pnl: 6.2, shares: 23.5 },
      { symbol: 'ETH', weight: 15, value: 780000, pnl: 4.8, shares: 231 },
      { symbol: 'BNB', weight: 10, value: 520000, pnl: 11.3, shares: 1750 },
    ],
    dailyPnl: 3200, mtdPnl: 28000, ytdPnl: 8.2, volatility: 6.8, sharpeRatio: 2.35, beta: 0.35, maxDrawdown: -3.2, var95: 28000, rebalanceFreq: 'monthly', lastRebalanced: '2024-06-01', status: 'active',
  },
  {
    id: '4', portfolioName: 'AIOPC智能组合D', strategy: 'AI动态配置',
    totalValue: 3500000, cashRatio: 5.2,
    positions: [
      { symbol: 'BTC', weight: 28, value: 980000, pnl: 15.6, shares: 14.8 },
      { symbol: 'ETH', weight: 22, value: 770000, pnl: 10.2, shares: 228 },
      { symbol: 'LINK', weight: 18, value: 630000, pnl: 22.8, shares: 8500 },
      { symbol: 'MATIC', weight: 16, value: 560000, pnl: -5.4, shares: 785000 },
      { symbol: 'UNI', weight: 10.8, value: 378000, pnl: 8.9, shares: 15800 },
    ],
    dailyPnl: 18900, mtdPnl: 95000, ytdPnl: 24.6, volatility: 19.8, sharpeRatio: 1.68, beta: 0.98, maxDrawdown: -12.1, var95: 58000, rebalanceFreq: 'weekly', lastRebalanced: '2024-06-18', status: 'rebalancing',
  },
  {
    id: '5', portfolioName: 'DeFi收益聚合器E', strategy: 'DeFi挖矿',
    totalValue: 1200000, cashRatio: 3.5,
    positions: [
      { symbol: 'ETH', weight: 50, value: 600000, pnl: 18.5, shares: 178 },
      { symbol: 'AVAX', weight: 25, value: 300000, pnl: 12.3, shares: 4670 },
      { symbol: 'FTM', weight: 21.5, value: 258000, pnl: -2.1, shares: 1250000 },
    ],
    dailyPnl: 8900, mtdPnl: 45000, ytdPnl: 28.9, volatility: 32.5, sharpeRatio: 1.15, beta: 1.52, maxDrawdown: -25.6, var95: 48000, rebalanceFreq: 'daily', lastRebalanced: '2024-06-23', status: 'active',
  },
  {
    id: '6', portfolioName: 'Layer2布局组合F', strategy: '主题投资',
    totalValue: 2100000, cashRatio: 12.0,
    positions: [
      { symbol: 'MATIC', weight: 28, value: 588000, pnl: 8.5, shares: 824000 },
      { symbol: 'ARB', weight: 25, value: 525000, pnl: -6.2, shares: 382000 },
      { symbol: 'OP', weight: 20, value: 420000, pnl: 14.8, shares: 292000 },
      { symbol: 'IMX', weight: 15, value: 315000, pnl: 22.1, shares: 168000 },
    ],
    dailyPnl: -3200, mtdPnl: -15000, ytdPnl: -5.8, volatility: 26.8, sharpeRatio: 0.68, beta: 1.45, maxDrawdown: -20.3, var95: 55000, rebalanceFreq: 'weekly', lastRebalanced: '2024-06-17', status: 'active',
  },
  {
    id: '7', portfolioName: '稳定币收益池G', strategy: '固定收益',
    totalValue: 8000000, cashRatio: 92.0,
    positions: [
      { symbol: 'USDT', weight: 50, value: 4000000, pnl: 0.02, shares: 4000000 },
      { symbol: 'USDC', weight: 35, value: 2800000, pnl: 0.02, shares: 2800000 },
      { symbol: 'DAI', weight: 7, value: 560000, pnl: 0.03, shares: 560000 },
    ],
    dailyPnl: 1600, mtdPnl: 11200, ytdPnl: 4.2, volatility: 0.5, sharpeRatio: 4.25, beta: 0.01, maxDrawdown: -0.1, var95: 4000, rebalanceFreq: 'monthly', lastRebalanced: '2024-06-01', status: 'active',
  },
  {
    id: '8', portfolioName: '已关闭组合H(历史)', strategy: '实验性策略',
    totalValue: 450000, cashRatio: 100.0,
    positions: [],
    dailyPnl: 0, mtdPnl: 0, ytdPnl: -15.2, volatility: 45.2, sharpeRatio: -0.25, beta: 1.85, maxDrawdown: -48.5, var95: 35000, rebalanceFreq: 'weekly', lastRebalanced: '2024-03-15', status: 'closed',
  },
];

const statusMap: Record<string, { label: string; color: string }> = {
  active: { label: '运行中', color: '#16A34A' },
  rebalancing: { label: '再平衡中', color: '#1677FF' },
  closed: { label: '已关闭', color: '#9CA3AF' },
};

const freqMap: Record<string, string> = {
  daily: '每日',
  weekly: '每周',
  monthly: '每月',
};

export default function PortfolioPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [strategyFilter, setStrategyFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredData = mockData.filter(item => {
    if (strategyFilter && !item.strategy.includes(strategyFilter)) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    return true;
  });

  const totalPortfolios = mockData.length;
  const totalAUM = mockData.filter(i => i.status !== 'closed').reduce((sum, i) => sum + i.totalValue, 0);
  const todayTotalPnl = mockData.reduce((sum, i) => sum + i.dailyPnl, 0);
  const avgVolatility = (mockData.filter(i => i.status !== 'closed').reduce((sum, i) => sum + i.volatility, 0) / mockData.filter(i => i.status !== 'closed').length).toFixed(1);
  const needRebalance = mockData.filter(i => i.status === 'rebalancing').length;

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: (record: Portfolio) => {
        setSelectedPortfolio(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'rebalance',
      label: '再平衡',
      icon: <SyncOutlined />,
      type: 'primary',
      hidden: (record: Portfolio) => record.status === 'closed' || record.status === 'rebalancing',
      onClick: (record: Portfolio) => {
        message.info(`启动 "${record.portfolioName}" 的再平衡流程`);
      },
    },
    {
      key: 'adjust',
      label: '调整',
      icon: <EditOutlined />,
      hidden: (record: Portfolio) => record.status === 'closed',
      onClick: (record: Portfolio) => {
        message.info(`调整 "${record.portfolioName}" 配置`);
      },
    },
    {
      key: 'close',
      label: '关闭',
      icon: <StopOutlined />,
      danger: true,
      hidden: (record: Portfolio) => record.status === 'closed',
      onClick: (record: Portfolio) => {
        message.warning(`确认关闭组合 "${record.portfolioName}"？`);
      },
    },
    {
      key: 'report',
      label: '报告',
      icon: <FileTextOutlined />,
      onClick: (record: Portfolio) => {
        message.success(`生成 "${record.portfolioName}" 的分析报告`);
      },
    },
  ];

  const columns = [
    {
      title: '组合名',
      dataIndex: 'portfolioName',
      key: 'portfolioName',
      width: 180,
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '策略',
      dataIndex: 'strategy',
      key: 'strategy',
      width: 110,
      render: (text: string) => <Tag color="blue">{text}</Tag>,
    },
    {
      title: '总值$',
      dataIndex: 'totalValue',
      key: 'totalValue',
      width: 110,
      render: (val: number) => `$${(val / 10000).toFixed(1)}万`,
    },
    {
      title: '现金比%',
      dataIndex: 'cashRatio',
      key: 'cashRatio',
      width: 80,
      render: (val: number) => `${val.toFixed(1)}%`,
    },
    {
      title: '日PnL$',
      dataIndex: 'dailyPnl',
      key: 'dailyPnl',
      width: 100,
      render: (val: number) => (
        <span className={`font-semibold ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {val >= 0 ? '+' : ''}${val.toLocaleString()}
        </span>
      ),
    },
    {
      title: '月PnL$',
      dataIndex: 'mtdPnl',
      key: 'mtdPnl',
      width: 100,
      render: (val: number) => (
        <span className={val >= 0 ? 'text-green-600' : 'text-red-600'}>
          {val >= 0 ? '+' : ''}${val.toLocaleString()}
        </span>
      ),
    },
    {
      title: '年YTD%',
      dataIndex: 'ytdPnl',
      key: 'ytdPnl',
      width: 80,
      render: (val: number) => (
        <span className={`font-bold ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {val >= 0 ? '+' : ''}{val.toFixed(1)}%
        </span>
      ),
    },
    {
      title: '波动率%',
      dataIndex: 'volatility',
      key: 'volatility',
      width: 80,
      render: (val: number) => `${val.toFixed(1)}%`,
    },
    {
      title: 'Sharpe',
      dataIndex: 'sharpeRatio',
      key: 'sharpeRatio',
      width: 70,
      render: (val: number) => (
        <span className={val >= 1.5 ? 'text-green-600 font-semibold' : ''}>{val.toFixed(2)}</span>
      ),
    },
    {
      title: 'Beta',
      dataIndex: 'beta',
      key: 'beta',
      width: 60,
      render: (val: number) => val.toFixed(2),
    },
    {
      title: '最大回撤%',
      dataIndex: 'maxDrawdown',
      key: 'maxDrawdown',
      width: 100,
      render: (val: number) => (
        <span className={val > -10 ? 'text-green-600' : val > -20 ? 'text-orange-500' : 'text-red-600'}>
          {val.toFixed(1)}%
        </span>
      ),
    },
    {
      title: 'VaR95',
      dataIndex: 'var95',
      key: 'var95',
      width: 80,
      render: (val: number) => `$${(val / 1000).toFixed(0)}K`,
    },
    {
      title: '再平衡频率',
      dataIndex: 'rebalanceFreq',
      key: 'rebalanceFreq',
      width: 100,
      render: (freq: string) => freqMap[freq],
    },
    {
      title: '最后再平衡',
      dataIndex: 'lastRebalanced',
      key: 'lastRebalanced',
      width: 110,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => (
        <Tag color={statusMap[status]?.color as any}>{statusMap[status]?.label}</Tag>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <PieChartOutlined className="text-3xl" style={{ color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0">投资组合管理</h1>
            <p className="text-gray-500 text-sm mt-1">
              多策略组合配置与监控 · 资产分配/相关性/再平衡 · AIOPC组合优化器
            </p>
          </div>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="组合总数"
              value={totalPortfolios}
              suffix="个"
              icon={<DashboardOutlined />}
              color="#1677FF"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="总AUM"
              value={`${(totalAUM / 100000000).toFixed(2)}`}
              suffix="亿"
              prefix="$"
              icon={<DollarOutlined />}
              color="#16A34A"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="今日PnL"
              value={`${todayTotalPnl >= 0 ? '+' : ''}${(todayTotalPnl / 1000).toFixed(1)}`}
              suffix="K"
              prefix="$"
              icon={todayTotalPnl >= 0 ? <RiseOutlined /> : <FallOutlined />}
              color={todayTotalPnl >= 0 ? '#16A34A' : '#DC2626'}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="平均波动率"
              value={avgVolatility}
              suffix="%"
              icon={<WarningOutlined />}
              color="#F59E0B"
            />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap size="middle">
            <Select
              placeholder="策略筛选"
              allowClear
              style={{ width: 150 }}
              value={strategyFilter || undefined}
              onChange={setStrategyFilter}
            >
              <Select.Option value="多因子">多因子均衡</Select.Option>
              <Select.Option value="动量">动量驱动</Select.Option>
              <Select.Option value="套利">套利增强</Select.Option>
              <Select.Option value="AI">AI动态配置</Select.Option>
              <Select.Option value="DeFi">DeFi挖矿</Select.Option>
              <Select.Option value="主题">主题投资</Select.Option>
              <Select.Option value="固定">固定收益</Select.Option>
            </Select>
            <Select
              placeholder="状态筛选"
              allowClear
              style={{ width: 130 }}
              value={statusFilter || undefined}
              onChange={setStatusFilter}
            >
              {Object.entries(statusMap).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable
          columns={columns as any}
          dataSource={filteredData as any}
          rowKey="id"
          actions={actions}
          showSearch={false}
          showAdd={false}
        />

        {/* 详情 Modal */}
        <Modal
          title={`组合详情 - ${selectedPortfolio?.portfolioName || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={880}
        >
          {selectedPortfolio && (
            <div className="space-y-6">
              {/* 组合概况 */}
              <Descriptions title="组合概况" bordered column={2} size="small">
                <Descriptions.Item label="组合名称" span={2}>{selectedPortfolio.portfolioName}</Descriptions.Item>
                <Descriptions.Item label="策略类型"><Tag color="blue">{selectedPortfolio.strategy}</Tag></Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusMap[selectedPortfolio.status]?.color as any}>{statusMap[selectedPortfolio.status]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="总资产">${selectedPortfolio.totalValue.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="现金比例">{selectedPortfolio.cashRatio.toFixed(1)}%</Descriptions.Item>
                <Descriptions.Item label="年化收益(YTD)">
                  <span className={`text-lg font-bold ${selectedPortfolio.ytdPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedPortfolio.ytdPnl >= 0 ? '+' : ''}{selectedPortfolio.ytdPnl.toFixed(1)}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="最后再平衡">{selectedPortfolio.lastRebalanced}</Descriptions.Item>
              </Descriptions>

              {/* 持仓明细 */}
              <Table
                dataSource={selectedPortfolio.positions}
                rowKey="symbol"
                size="small"
                pagination={false}
                title={() => <span><PieChartOutlined /> 持仓明细</span>}
                columns={[
                  { title: '标的', dataIndex: 'symbol', render: (s: string) => <code className="font-bold">{s}</code> },
                  { title: '权重%', dataIndex: 'weight', render: (w: number) => `${w}%` },
                  { title: '价值$', dataIndex: 'value', render: (v: number) => `$${v.toLocaleString()}` },
                  { title: '盈亏%', dataIndex: 'pnl', render: (p: number) => <span className={p >= 0 ? 'text-green-600' : 'text-red-600'}>{p >= 0 ? '+' : ''}{p}%</span> },
                  { title: '数量', dataIndex: 'shares', render: (s: number) => s.toLocaleString() },
                ]}
              />

              {/* 风险指标 */}
              <Descriptions title="风险指标" bordered column={3} size="small">
                <Descriptions.Item label="波动率">{selectedPortfolio.volatility}%</Descriptions.Item>
                <Descriptions.Item label="Sharpe比率">
                  <span className={selectedPortfolio.sharpeRatio >= 1.5 ? 'text-green-600 font-bold' : ''}>{selectedPortfolio.sharpeRatio.toFixed(2)}</span>
                </Descriptions.Item>
                <Descriptions.Item label="Beta">{selectedPortfolio.beta.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="最大回撤">
                  <span className={selectedPortfolio.maxDrawdown > -10 ? 'text-green-600' : 'text-red-600'}>
                    {selectedPortfolio.maxDrawdown.toFixed(1)}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="VaR(95%)">${selectedPortfolio.var95.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="日PnL">
                  <span className={`font-semibold ${selectedPortfolio.dailyPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    ${selectedPortfolio.dailyPnl.toLocaleString()}
                  </span>
                </Descriptions.Item>
              </Descriptions>

              {/* AIOPC组合健康度 */}
              <Card
                title={
                  <span>
                    <ThunderboltOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                    AIOPC组合健康度评估
                  </span>
                }
                size="small"
                style={{ borderColor: '#F0B90B' }}
              >
                <Row gutter={[16, 12]}>
                  {[
                    { label: '分散化', score: selectedPortfolio.positions.length * 18, color: '#1677FF' },
                    { label: '相关性控制', score: Math.max(40, 90 - selectedPortfolio.beta * 20), color: '#16A34A' },
                    { label: '波动管理', score: Math.max(30, 100 - selectedPortfolio.volatility * 2), color: '#F59E0B' },
                    { label: '收益质量', score: Math.max(50, 70 + selectedPortfolio.sharpeRatio * 10), color: '#7C3AED' },
                    { label: '回撤控制', score: Math.max(20, 100 + selectedPortfolio.maxDrawdown * 2), color: '#EC4899' },
                  ].map(item => (
                    <Col xs={24} sm={12} md={8} lg={4} key={item.label}>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                        <Progress
                          percent={Math.min(100, item.score)}
                          strokeColor={item.color}
                          format={(percent) => <span style={{ color: item.color }}>{percent}</span>}
                          size={48}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>

              {/* 再平衡建议 */}
              <Card
                title={<span><SyncOutlined /> AIOPC再平衡建议</span>}
                size="small"
                type="inner"
                style={{ backgroundColor: '#F0FDF4' }}
              >
                <div className="space-y-2 text-sm">
                  <div>✅ 当前组合整体健康度良好，建议维持当前配置。</div>
                  <div>💡 提示：{selectedPortfolio.cashRatio > 20 ? '现金占比较高，可考虑增加权益类资产配置。' : '注意监控单一资产集中度风险。'}</div>
                  <div>📊 预计下次自动再平衡时间：{dayjs(selectedPortfolio.lastRebalanced).add(selectedPortfolio.rebalanceFreq === 'daily' ? 1 : selectedPortfolio.rebalanceFreq === 'weekly' ? 7 : 30, 'day').format('YYYY-MM-DD')}</div>
                </div>
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
