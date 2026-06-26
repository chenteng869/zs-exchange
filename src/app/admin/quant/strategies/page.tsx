'use client';

import { useState } from 'react';
import { Button, Space, Tag, Modal, Descriptions, Divider, Select, Card, Tooltip, Progress, Table, message } from 'antd';
import {
  RobotOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined,
  TrophyOutlined,
  FilterOutlined,
  SearchOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import DataCard from '@/components/admin/DataCard';

const { Option } = Select;

const mockStrategies = [
  { strategyId: 'STR-001', name: 'AIOPC趋势跟踪V3', type: 'trend', status: 'live', creator: '张明远', aiScore: 92, aiopcScore: 88, sharpeRatio: 2.35, maxDrawdown: -8.2, winRate: 68.5, totalReturn: 156.8, aum: 1250000, createdAt: '2024-01-15', updatedAt: '2025-06-23' },
  { strategyId: 'STR-002', name: '网格套利增强版', type: 'grid', status: 'live', creator: '李思涵', aiScore: 85, aiopcScore: 82, sharpeRatio: 1.89, maxDrawdown: -5.6, winRate: 75.2, totalReturn: 89.4, aum: 890000, createdAt: '2024-02-20', updatedAt: '2025-06-22' },
  { strategyId: 'STR-003', name: '跨交易所价差套利', type: 'arbitrage', status: 'backtesting', creator: '王浩然', aiScore: 78, aiopcScore: 75, sharpeRatio: 3.12, maxDrawdown: -2.8, winRate: 82.0, totalReturn: 45.6, aum: 500000, createdAt: '2024-03-10', updatedAt: '2025-06-21' },
  { strategyId: 'STR-004', name: 'AI做市策略Pro', type: 'market_making', status: 'live', creator: '陈雨晴', aiScore: 88, aiopcScore: 91, sharpeRatio: 2.78, maxDrawdown: -3.5, winRate: 91.2, totalReturn: 67.8, aum: 2100000, createdAt: '2024-01-25', updatedAt: '2025-06-23' },
  { strategyId: 'STR-005', name: '动量反转Alpha', type: 'trend', status: 'paused', creator: '刘子轩', aiScore: 65, aiopcScore: 58, sharpeRatio: 0.85, maxDrawdown: -15.8, winRate: 45.3, totalReturn: -12.5, aum: 350000, createdAt: '2024-04-01', updatedAt: '2025-06-18' },
  { strategyId: 'STR-006', name: 'AIOPC统计套利', type: 'arbitrage', status: 'draft', creator: '赵晓峰', aiScore: 72, aiopcScore: 70, sharpeRatio: 1.56, maxDrawdown: -7.2, winRate: 63.8, totalReturn: 0, aum: 0, createdAt: '2024-05-15', updatedAt: '2025-06-10' },
  { strategyId: 'STR-007', name: '高频网格V2', type: 'grid', status: 'live', creator: '孙雅琪', aiScore: 81, aiopcScore: 79, sharpeRatio: 2.05, maxDrawdown: -6.8, winRate: 71.5, totalReturn: 112.3, aum: 1680000, createdAt: '2024-02-08', updatedAt: '2025-06-23' },
  { strategyId: 'STR-008', name: '智能仓位管理器', type: 'market_making', status: 'stopped', creator: '周博文', aiScore: 55, aiopcScore: 48, sharpeRatio: -0.32, maxDrawdown: -22.5, winRate: 38.2, totalReturn: -28.9, aum: 120000, createdAt: '2024-06-20', updatedAt: '2025-05-30' },
  { strategyId: 'STR-009', name: 'AIOPC多因子选币', type: 'trend', status: 'backtesting', creator: '吴佳怡', aiScore: 95, aiopcScore: 93, sharpeRatio: 2.92, maxDrawdown: -10.5, winRate: 62.1, totalReturn: 0, aum: 0, createdAt: '2025-04-01', updatedAt: '2025-06-22' },
  { strategyId: 'STR-010', name: '波动率均值回归', type: 'arbitrage', status: 'live', creator: '郑凯文', aiScore: 76, aiopcScore: 74, sharpeRatio: 1.68, maxDrawdown: -4.9, winRate: 69.7, totalReturn: 78.5, aum: 750000, createdAt: '2024-07-12', updatedAt: '2025-06-23' },
];

const strategyTypeMap: Record<string, string> = { trend: '趋势跟踪', arbitrage: '套利', grid: '网格交易', market_making: '做市' };
const strategyTypeColor: Record<string, string> = { trend: 'blue', arbitrage: 'purple', grid: 'green', market_making: 'orange' };
const statusMap: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  backtesting: { label: '回测中', color: 'processing' },
  live: { label: '运行中', color: 'success' },
  paused: { label: '已暂停', color: 'warning' },
  stopped: { label: '已停止', color: 'error' },
};

const mockOperationLogs = [
  { time: '2025-06-23 14:32:00', action: '策略启动', operator: '系统自动', detail: '满足上线条件，自动启动实盘交易' },
  { time: '2025-06-23 09:15:00', action: '参数调整', operator: '张明远', detail: '调整止损线从-10%至-8%' },
  { time: '2025-06-22 18:00:00', action: '风控触发', operator: '风控引擎', detail: '单日回撤超预警，自动减仓50%' },
  { time: '2025-06-21 10:30:00', action: '版本更新', operator: '张明远', detail: '升级至V3.2版本，优化入场逻辑' },
];

export default function QuantStrategiesPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchText, setSearchText] = useState('');

  const filteredData = mockStrategies.filter(item => {
    if (typeFilter && item.type !== typeFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    if (searchText && !item.name.toLowerCase().includes(searchText.toLowerCase()) && !item.strategyId.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const liveCount = mockStrategies.filter(s => s.status === 'live').length;
  const todayReturn = mockStrategies.filter(s => s.status === 'live').reduce((sum, s) => sum + s.totalReturn * 0.02, 0);
  const avgSharpe = (mockStrategies.filter(s => s.status === 'live').reduce((sum, s) => sum + s.sharpeRatio, 0) / liveCount || 0).toFixed(2);
  const avgAiopc = Math.round(mockStrategies.reduce((sum, s) => sum + s.aiopcScore, 0) / mockStrategies.length);

  const columns = [
    { title: '策略ID', dataIndex: 'strategyId', key: 'strategyId', width: 100, render: (t: string) => <span className="font-mono text-xs">{t}</span> },
    { title: '策略名称', dataIndex: 'name', key: 'name', width: 200, render: (t: string) => <span className="font-semibold text-blue-600">{t}</span> },
    {
      title: '类型', dataIndex: 'type', key: 'type', width: 110,
      render: (t: string) => <Tag color={strategyTypeColor[t]}>{strategyTypeMap[t]}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 100,
      render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.label}</Tag>,
    },
    { title: '创建者', dataIndex: 'creator', key: 'creator', width: 90 },
    {
      title: 'AI评分', dataIndex: 'aiScore', key: 'aiScore', width: 80,
      render: (v: number) => <Tooltip title="AI综合评估分数"><Progress type="circle" percent={v} size={42} strokeColor={v >= 80 ? '#1677FF' : v >= 60 ? '#F59E0B' : '#DC2626'} /></Tooltip>,
    },
    {
      title: 'AIOPC评分', dataIndex: 'aiopcScore', key: 'aiopcScore', width: 100,
      render: (v: number) => <span style={{ color: '#F0B90B', fontWeight: 600 }}>{v}</span>,
    },
    { title: '夏普比率', dataIndex: 'sharpeRatio', key: 'sharpeRatio', width: 95, render: (v: number) => <span className={v >= 1.5 ? 'text-green-600' : v >= 0 ? 'text-orange-500' : 'text-red-600'}>{v.toFixed(2)}</span> },
    { title: '最大回撤(%)', dataIndex: 'maxDrawdown', key: 'maxDrawdown', width: 110, render: (v: number) => <span className="text-red-500">{v}%</span> },
    { title: '胜率(%)', dataIndex: 'winRate', key: 'winRate', width: 80, render: (v: number) => `${v}%` },
    { title: '总收益(%)', dataIndex: 'totalReturn', key: 'totalReturn', width: 100, render: (v: number) => <span className={v >= 0 ? 'text-green-600' : 'text-red-600'}>{v > 0 ? '+' : ''}{v}%</span> },
    { title: 'AUM(万)', dataIndex: 'aum', key: 'aum', width: 100, render: (v: number) => `¥${(v / 10000).toFixed(0)}万` },
  ];

  const actions: any[] = [
    { key: 'view', label: '查看', icon: <EyeOutlined />, onClick: (record: any) => { setSelectedStrategy(record); setDetailModalOpen(true); } },
    { key: 'backtest', label: '回测', icon: <LineChartOutlined />, onClick: (record: any) => message.info(`启动 ${record.name} 回测任务`) },
    {
      key: 'toggle', label: '启停',
      icon: <PlayCircleOutlined />,
      hidden: () => false,
      onClick: (record: any) => message.success(`${record.name} 状态切换成功`),
    },
    { key: 'log', label: '日志', icon: <FileTextOutlined />, onClick: (record: any) => message.info(`查看 ${record.name} 运行日志`) },
  ];

  const logColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 180 },
    { title: '操作', dataIndex: 'action', key: 'action', width: 100, render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '操作人', dataIndex: 'operator', key: 'operator', width: 100 },
    { title: '详情', dataIndex: 'detail', key: 'detail' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <RobotOutlined style={{ fontSize: 28, color: '#F0B90B' }} />
              <h1 className="text-2xl font-bold m-0">量化策略管理中心</h1>
              <Tag color="#F0B90B" style={{ border: 'none', color: '#000', fontWeight: 600 }}>AIOPC</Tag>
            </div>
            <p className="text-gray-500 text-sm mt-2 ml-11">AI驱动策略全生命周期管理 · 策略编写/回测/上线/监控 · Powered by AIOPC</p>
          </div>
          <Space>
            <Button icon={<SearchOutlined />}>刷新数据</Button>
            <Button type="primary" style={{ backgroundColor: '#F0B90B', borderColor: '#F0B90B', color: '#000' }} icon={<ThunderboltOutlined />}>新建策略</Button>
          </Space>
        </div>

        {/* DataCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard title="策略总数" value={mockStrategies.length} icon={<RobotOutlined />} color="#1677FF" description="全量策略库" />
          <DataCard title="运行中" value={liveCount} icon={<PlayCircleOutlined />} color="#16A34A" suffix={`/${mockStrategies.length}`} description="实时在线策略" />
          <DataCard title="今日收益" value={todayReturn.toFixed(2)} prefix="$" icon={<TrophyOutlined />} color={todayReturn >= 0 ? '#16A34A' : '#DC2626'} suffix="% " description="预估日收益" trend={todayReturn >= 0 ? 'up' : 'down'} trendValue="+2.3%" />
          <DataCard title="平均夏普" value={avgSharpe} icon={<LineChartOutlined />} color="#7C3AED" description="运行中策略均值" />
          <DataCard title="AIOPC均分" value={avgAiopc} icon={<SafetyCertificateOutlined />} color="#F0B90B" description="AIOPC核心评分" />
        </div>

        {/* 筛选栏 */}
        <Card size="small">
          <Space wrap>
            <Select placeholder="策略类型" allowClear value={typeFilter || undefined} onChange={setTypeFilter} style={{ width: 140 }}>
              <Option value="trend">趋势跟踪</Option>
              <Option value="arbitrage">套利</Option>
              <Option value="grid">网格交易</Option>
              <Option value="market_making">做市</Option>
            </Select>
            <Select placeholder="策略状态" allowClear value={statusFilter || undefined} onChange={setStatusFilter} style={{ width: 130 }}>
              <Option value="draft">草稿</Option>
              <Option value="backtesting">回测中</Option>
              <Option value="live">运行中</Option>
              <Option value="paused">已暂停</Option>
              <Option value="stopped">已停止</Option>
            </Select>
            <Select
              showSearch
              placeholder="搜索策略名称/ID"
              allowClear
              value={searchText || undefined}
              onSearch={(v) => setSearchText(v)}
              onChange={(v) => setSearchText(v)}
              style={{ width: 240 }}
              filterOption={false}
            >
              {mockStrategies.map(s => (
                <Option key={s.strategyId} value={s.name}>{s.name} ({s.strategyId})</Option>
              ))}
            </Select>
            <Tag icon={<FilterOutlined />} color="processing">共 {filteredData.length} 条</Tag>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable columns={columns as any} dataSource={filteredData as any} rowKey="strategyId" actions={actions} />

        {/* 详情弹窗 */}
        <Modal
          title={
            <Space>
              <span>{selectedStrategy?.name}</span>
              <Tag color="#F0B90B" style={{ color: '#000' }}>AIOPC {selectedStrategy?.aiopcScore}</Tag>
            </Space>
          }
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
            <Button key="backtest" icon={<LineChartOutlined />}>执行回测</Button>,
            <Button key="toggle" type="primary" icon={selectedStrategy?.status === 'live' ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              style={{ backgroundColor: selectedStrategy?.status !== 'live' ? '#16A34A' : undefined }}
            >
              {selectedStrategy?.status === 'live' ? '暂停策略' : '启动策略'}
            </Button>,
          ]}
          width={800}
        >
          {selectedStrategy && (
            <div className="space-y-4">
              {/* 基本信息 */}
              <Card size="small" title="基本信息">
                <Descriptions column={2} size="small">
                  <Descriptions.Item label="策略ID">{selectedStrategy.strategyId}</Descriptions.Item>
                  <Descriptions.Item label="策略名称">{selectedStrategy.name}</Descriptions.Item>
                  <Descriptions.Item label="类型"><Tag color={strategyTypeColor[selectedStrategy.type]}>{strategyTypeMap[selectedStrategy.type]}</Tag></Descriptions.Item>
                  <Descriptions.Item label="状态"><Tag color={statusMap[selectedStrategy.status]?.color}>{statusMap[selectedStrategy.status]?.label}</Tag></Descriptions.Item>
                  <Descriptions.Item label="创建者">{selectedStrategy.creator}</Descriptions.Item>
                  <Descriptions.Item label="创建时间">{selectedStrategy.createdAt}</Descriptions.Item>
                  <Descriptions.Item label="更新时间">{selectedStrategy.updatedAt}</Descriptions.Item>
                </Descriptions>
              </Card>

              {/* 绩效指标 */}
              <Card size="small" title="绩效指标">
                <Descriptions column={4} size="small">
                  <Descriptions.Item label="总收益率"><span className={selectedStrategy.totalReturn >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{selectedStrategy.totalReturn > 0 ? '+' : ''}{selectedStrategy.totalReturn}%</span></Descriptions.Item>
                  <Descriptions.Item label="夏普比率"><span className={selectedStrategy.sharpeRatio >= 1.5 ? 'text-green-600' : 'text-orange-500'}>{selectedStrategy.sharpeRatio.toFixed(2)}</span></Descriptions.Item>
                  <Descriptions.Item label="最大回撤"><span className="text-red-500">{selectedStrategy.maxDrawdown}%</span></Descriptions.Item>
                  <Descriptions.Item label="胜率">{selectedStrategy.winRate}%</Descriptions.Item>
                </Descriptions>
              </Card>

              {/* AIOPC评估 */}
              <Card size="small" title={<Space><SafetyCertificateOutlined style={{ color: '#F0B90B' }} /><span>AIOPC 综合评估</span></Space>} style={{ borderColor: '#F0B90B' }}>
                <div className="flex gap-6 items-center">
                  <div className="text-center">
                    <div style={{ fontSize: 36, fontWeight: 700, color: '#F0B90B' }}>{selectedStrategy.aiopcScore}</div>
                    <div className="text-gray-500 text-sm mt-1">AIOPC评分</div>
                  </div>
                  <Divider type="vertical" style={{ height: 60 }} />
                  <div className="flex-1 space-y-2">
                    <div><span className="text-gray-500 w-24 inline-block">AI评分:</span><Progress percent={selectedStrategy.aiScore} size="small" strokeWidth={8} /></div>
                    <div><span className="text-gray-500 w-24 inline-block">风险等级:</span><Tag color={selectedStrategy.maxDrawdown > -10 ? 'green' : selectedStrategy.maxDrawdown > -15 ? 'orange' : 'red'}>{selectedStrategy.maxDrawdown > -10 ? '低风险' : selectedStrategy.maxDrawdown > -15 ? '中风险' : '高风险'}</Tag></div>
                    <div><span className="text-gray-500 w-24 inline-block">AUM规模:</span><span className="font-semibold">¥{(selectedStrategy.aum / 10000).toFixed(0)}万</span></div>
                  </div>
                </div>
              </Card>

              {/* 历史净值曲线描述 */}
              <Card size="small" title="历史净值走势">
                <p className="text-gray-600 text-sm leading-relaxed">
                  该策略自 {selectedStrategy.createdAt} 创建以来，累计收益达到 <span className={selectedStrategy.totalReturn >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{selectedStrategy.totalReturn}%</span>。
                  最大回撤为 <span className="text-red-500 font-semibold">{selectedStrategy.maxDrawdown}%</span>，
                  夏普比率 {selectedStrategy.sharpeRatio.toFixed(2)}，胜率 {selectedStrategy.winRate}%。
                  AIOPC综合评分为 <span style={{ color: '#F0B90B', fontWeight: 700 }}>{selectedStrategy.aiopcScore}</span> 分，{selectedStrategy.aiopcScore >= 80 ? '表现优异，建议持续关注。' : '有优化空间，建议调整参数后重新测试。'}
                </p>
              </Card>

              {/* 操作日志 */}
              <Card size="small" title="操作日志" className="mt-4">
                <Table dataSource={mockOperationLogs} columns={logColumns} rowKey="time" pagination={false} size="small" />
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
