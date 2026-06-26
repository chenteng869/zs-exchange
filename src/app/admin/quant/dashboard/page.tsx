'use client';

import { Card, Row, Col, Table, Tag, Button, Space, Statistic, Tabs, Progress, Divider } from 'antd';
import {
  RobotOutlined,
  EyeOutlined,
  ReloadOutlined,
  TrophyOutlined,
  RiseOutlined,
  FallOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  BellOutlined,
  ThunderboltOutlined,
  FundViewOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';
import DataCard from '@/components/admin/DataCard';

const mockTasks = [
  { id: 'TASK-001', target: 'BTC/USDT', status: 'completed', createTime: '2024-05-13 14:30:00' },
  { id: 'TASK-002', target: 'ETH/USDT', status: 'running', createTime: '2024-05-13 14:25:00' },
  { id: 'TASK-003', target: 'SOL/USDT', status: 'pending', createTime: '2024-05-13 14:20:00' },
  { id: 'TASK-004', target: 'BNB/USDT', status: 'completed', createTime: '2024-05-13 14:15:00' },
  { id: 'TASK-005', target: 'ADA/USDT', status: 'failed', createTime: '2024-05-13 14:10:00' },
  { id: 'TASK-006', target: 'DOT/USDT', status: 'running', createTime: '2024-05-13 14:05:00' },
  { id: 'TASK-007', target: 'MATIC/USDT', status: 'completed', createTime: '2024-05-13 14:00:00' },
  { id: 'TASK-008', target: 'LINK/USDT', status: 'pending', createTime: '2024-05-13 13:55:00' },
  { id: 'TASK-009', target: 'AVAX/USDT', status: 'completed', createTime: '2024-05-13 13:50:00' },
  { id: 'TASK-010', target: 'UNI/USDT', status: 'running', createTime: '2024-05-13 13:45:00' },
];

// 新增: 最新策略排行数据
const mockStrategyRanking = [
  { rank: 1, name: 'AIOPC趋势跟踪V3', totalReturn: '+156.8%', sharpe: 2.35, winRate: '68.5%', aum: '$125万', aiopcScore: 88, trend: 'up' },
  { rank: 2, name: 'AI做市策略Pro', totalReturn: '+67.8%', sharpe: 2.78, winRate: '91.2%', aum: '$210万', aiopcScore: 91, trend: 'up' },
  { rank: 3, name: '高频网格V2', totalReturn: '+112.3%', sharpe: 2.05, winRate: '71.5%', aum: '$168万', aiopcScore: 79, trend: 'up' },
  { rank: 4, name: '跨交易所价差套利', totalReturn: '+45.6%', sharpe: 3.12, winRate: '82.0%', aum: '$50万', aiopcScore: 75, trend: 'up' },
  { rank: 5, name: '波动率均值回归', totalReturn: '+78.5%', sharpe: 1.68, winRate: '69.7%', aum: '$75万', aiopcScore: 74, trend: 'down' },
];

// 新增: 实时预警列表
const mockAlerts = [
  { time: '14:32', level: 'warning', message: '动量反转Alpha 单日回撤超5%，触发黄色预警', strategy: 'MON-005' },
  { time: '14:25', level: 'info', message: 'AI做市策略Pro 持仓集中度达82%，接近阈值', strategy: 'MON-004' },
  { time: '12:15', level: 'danger', message: '趋势增强Beta 连续亏损第7天，建议立即检查', strategy: 'MON-009' },
  { time: '10:00', level: 'info', message: '套利组合策略 离线超过48小时，需检查连接', strategy: 'MON-010' },
  { time: '09:30', level: 'warning', message: '市场波动率上升至62%，注意风险敞口', strategy: '全局' },
];

const taskColumns = [
  { title: '任务ID', dataIndex: 'id', key: 'id', render: (text: string) => <span className="font-mono text-blue-400">{text}</span> },
  { title: '分析标的', dataIndex: 'target', key: 'target', render: (text: string) => <Tag color="blue">{text}</Tag> },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    render: (status: string) => {
      const config: Record<string, { color: string; label: string }> = {
        completed: { color: 'success', label: '已完成' },
        running: { color: 'processing', label: '运行中' },
        pending: { color: 'default', label: '等待中' },
        failed: { color: 'error', label: '失败' },
      };
      return <Tag color={config[status]?.color}>{config[status]?.label}</Tag>;
    },
  },
  { title: '创建时间', dataIndex: 'createTime', key: 'createTime' },
  {
    title: '操作',
    key: 'action',
    render: () => (
      <Space size="small">
        <Button type="link" size="small" icon={<EyeOutlined />}>查看</Button>
      </Space>
    ),
  },
];

const rankingColumns = [
  {
    title: '排名',
    dataIndex: 'rank',
    key: 'rank',
    width: 60,
    render: (r: number) => (
      <span className={`font-bold text-lg ${r <= 3 ? 'text-yellow-500' : 'text-gray-400'}`}>
        {r <= 3 ? ['🥇', '🥈', '🥉'][r - 1] : `#${r}`}
      </span>
    ),
  },
  { title: '策略名称', dataIndex: 'name', key: 'name', render: (t: string) => <span className="font-semibold text-blue-600">{t}</span> },
  {
    title: '总收益',
    dataIndex: 'totalReturn',
    key: 'totalReturn',
    width: 95,
    render: (t: string) => <span className={t.includes('+') ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{t}</span>,
  },
  { title: '夏普', dataIndex: 'sharpe', key: 'sharpe', width: 70, render: (v: number) => <span className="text-green-600">{v.toFixed(2)}</span> },
  { title: '胜率', dataIndex: 'winRate', key: 'winRate', width: 70 },
  { title: 'AUM', dataIndex: 'aum', key: 'aum', width: 75 },
  {
    title: 'AIOPC',
    dataIndex: 'aiopcScore',
    key: 'aiopcScore',
    width: 70,
    render: (v: number) => <span style={{ color: '#F0B90B', fontWeight: 700 }}>{v}</span>,
  },
  {
    title: '趋势',
    dataIndex: 'trend',
    key: 'trend',
    width: 55,
    render: (t: string) => t === 'up' ? <RiseOutlined style={{ color: '#16A34A' }} /> : <FallOutlined style={{ color: '#DC2626' }} />,
  },
];

const heatmapOption = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['BTC', 'ETH', 'SOL', 'BNB', 'ADA', 'DOT', 'MATIC', 'LINK'] },
  yAxis: { type: 'value', name: '热度指数' },
  series: [
    {
      type: 'bar',
      data: [95, 88, 76, 72, 65, 58, 52, 48],
      itemStyle: {
        color: (params: any) => {
          const colors = ['#16A34A', '#22C55E', '#84CC16', '#EAB308', '#F97316', '#EF4444', '#DC2626', '#B91C1C'];
          return { color: colors[params.dataIndex] };
        },
      },
    },
  ],
};

const radarOption = {
  tooltip: {},
  radar: {
    indicator: [
      { name: '技术面', max: 100 },
      { name: '基本面', max: 100 },
      { name: '资金面', max: 100 },
      { name: '情绪面', max: 100 },
      { name: '消息面', max: 100 },
    ],
    shape: 'circle',
    splitNumber: 5,
    axisName: { color: '#9CA3AF' },
    splitLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
    splitArea: { areaStyle: { color: ['rgba(22,163,74,0.02)', 'rgba(22,163,74,0.04)'] } },
    axisLine: { lineStyle: { color: 'rgba(255,255,255,0.2)' } },
  },
  series: [
    {
      type: 'radar',
      data: [
        {
          value: [85, 78, 92, 68, 75],
          name: '综合评分',
          areaStyle: { color: 'rgba(240, 185, 11, 0.2)' },
          lineStyle: { color: '#F0B90B', width: 2 },
          itemStyle: { color: '#F0B90B' },
        },
      ],
    },
  ],
};

export default function QuantDashboardPage() {
  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <RobotOutlined style={{ fontSize: 28, color: '#F0B90B' }} />
            <div>
              <h1 className="text-2xl font-bold m-0">量化仪表盘总览</h1>
              <p className="text-gray-400 text-sm mt-1">AI策略大脑实时监控中心 · Powered by AIOPC</p>
            </div>
            <Tag color="#F0B90B" style={{ border: 'none', color: '#000', fontWeight: 600 }}>AIOPC</Tag>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />}>刷新数据</Button>
            <Button type="primary" style={{ backgroundColor: '#F0B90B', borderColor: '#F0B90B', color: '#000' }} icon={<ThunderboltOutlined />}>快速操作</Button>
          </Space>
        </div>

        {/* DataCards - 统一风格 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="总资产"
              value="$2,345,678"
              icon={<FundViewOutlined />}
              color="#1677FF"
              description="Total Assets"
              trend="up"
              trendValue="+2.35%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="今日盈亏"
              value="12,345.67"
              prefix="$"
              icon={<TrophyOutlined />}
              color="#16A34A"
              suffix=""
              description="Today P&L (+0.53%)"
              trend="up"
              trendValue="+$3,280 vs 昨日"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="活跃策略数"
              value="23"
              icon={<RobotOutlined />}
              color="#7C3AED"
              description="Active Strategies"
              trend="up"
              trendValue="+2 本周新增"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="跟单用户数"
              value="1,256"
              icon={<RiseOutlined />}
              color="#F0B90B"
              description="Copy Trading Users"
              trend="up"
              trendValue="+38 本周"
            />
          </Col>
        </Row>

        {/* 上半部分: 任务列表 + 雷达图 + 市场情绪指数 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={<span className="font-semibold">最近分析任务</span>}
              className="border-gray-200"
              extra={<Tag color="blue">{mockTasks.length} 个任务</Tag>}
            >
              <Table
                dataSource={mockTasks}
                columns={taskColumns}
                pagination={false}
                rowKey="id"
                size="middle"
                scroll={{ x: 500 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card
              title={<Space><SafetyCertificateOutlined style={{ color: '#F0B90B' }} /><span className="font-semibold">AIOPC信号雷达</span></Space>}
              className="border-gray-200"
            >
              <SafeECharts option={radarOption} style={{ height: 320 }} title="信号雷达图" />
              <div className="mt-3 text-center">
                <Progress
                  percent={79}
                  strokeColor="#F0B90B"
                  format={() => <span style={{ color: '#F0B90B', fontWeight: 700 }}>综合评分 79</span>}
                  style={{ maxWidth: 250, margin: '0 auto' }}
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={4}>
            {/* 新增: AI市场情绪指数卡片 */}
            <Card
              title={<Space><ThunderboltOutlined style={{ color: '#F0B90B' }} /><span className="font-semibold">市场情绪</span></Space>}
              className="border-gray-200"
              style={{ borderColor: '#F0B90B', borderTopWidth: 3 }}
            >
              <div className="space-y-4">
                <div className="text-center">
                  <div style={{ fontSize: 42, fontWeight: 800, color: '#16A34A' }}>72</div>
                  <div className="text-gray-500 text-sm mt-1">AIOPC 情绪指数</div>
                  <Tag color="green" className="mt-1">偏多 · 乐观</Tag>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-500">贪婪恐惧</span>
                    <span className="font-semibold text-green-600">贪婪 (68)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">资金流向</span>
                    <span className="font-semibold text-green-600">净流入 +$2.3亿</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">波动率(VIX)</span>
                    <span className="font-semibold text-orange-500">18.5 低波</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">BTC主导</span>
                    <span className="font-semibold">52.3%</span>
                  </div>
                </div>
                <Divider style={{ margin: '12px 0' }} />
                <div className="text-xs text-gray-500 leading-relaxed">
                  AIOPC市场大脑基于链上数据、社交媒体情绪、资金流向和宏观经济指标综合计算得出。当前市场处于偏乐观状态，适合趋势策略运行。
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 中间部分: 市场热力图 */}
        <Card
          title={<span className="font-semibold">市场热度热力图</span>}
          className="border-gray-200"
        >
          <SafeECharts option={heatmapOption} style={{ height: 300 }} title="市场热力图" />
        </Card>

        {/* 下半部分: 最新策略排行 + 实时预警 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={14}>
            {/* 新增: 最新策略排行Table */}
            <Card
              title={
                <Space>
                  <TrophyOutlined style={{ color: '#F0B90B' }} />
                  <span className="font-semibold">最新策略收益排行 TOP5</span>
                </Space>
              }
              className="border-gray-200"
              extra={<Button type="link" size="small">查看全部 →</Button>}
            >
              <Table
                dataSource={mockStrategyRanking}
                columns={rankingColumns}
                pagination={false}
                rowKey="rank"
                size="middle"
                scroll={{ x: 650 }}
              />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            {/* 新增: 实时预警列表 */}
            <Card
              title={
                <Space>
                  <BellOutlined style={{ color: '#F59E0B' }} />
                  <span className="font-semibold">实时预警中心</span>
                </Space>
              }
              className="border-gray-200"
              extra={<Tag color="orange">{mockAlerts.length} 条预警</Tag>}
            >
              <div className="space-y-3">
                {mockAlerts.map((alert, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border ${idx === 2 ? 'bg-red-50 border-red-200' : idx === 0 || idx === 4 ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <Tag
                          color={alert.level === 'danger' ? 'error' : alert.level === 'warning' ? 'warning' : 'default'}
                          style={{ margin: 0, flexShrink: 0 }}
                        >
                          {alert.time}
                        </Tag>
                        <span className="text-sm truncate">{alert.message}</span>
                      </div>
                      <Tag color="blue" style={{ flexShrink: 0 }}>{alert.strategy}</Tag>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-3 text-center">
                <Button type="link" size="small" icon={<EyeOutlined />}>查看全部告警记录</Button>
              </div>
            </Card>
          </Col>
        </Row>
      </div>
    </AdminLayout>
  );
}
