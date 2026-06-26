'use client';

import { useState } from 'react';
import { Button, Space, Tag, Modal, Descriptions, Divider, Select, Card, Tooltip, Progress, Table, message } from 'antd';
import {
  DashboardOutlined,
  EyeOutlined,
  FileTextOutlined,
  SettingOutlined,
  BellOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined,
  TrophyOutlined,
  WarningOutlined,
  FilterOutlined,
  ThunderboltOutlined,
  FundOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import DataCard from '@/components/admin/DataCard';

const { Option } = Select;

const mockPerformance = [
  { monitorId: 'MON-001', strategyName: 'AIOPC趋势跟踪V3', category: 'momentum', status: 'normal', todayPnl: 2350, weekPnl: 12800, monthPnl: 45600, totalPnl: 156800, dailyReturns: Array.from({ length: 30 }, () => Number((Math.random() * 6 - 1).toFixed(2))), drawdownCurrent: -3.2, drawdownMax: -8.2, sharpeRatio: 2.35, sortinoRatio: 3.12, calmarRatio: 19.1, positionsOpen: 5, lastTradeTime: '2025-06-23 14:32:15', alertCount: 0 },
  { monitorId: 'MON-002', strategyName: '网格套利增强版', category: 'statistical', status: 'normal', todayPnl: 890, weekPnl: 5200, monthPnl: 18900, totalPnL: 89400, dailyReturns: Array.from({ length: 30 }, () => Number((Math.random() * 4 - 0.5).toFixed(2))), drawdownCurrent: -1.8, drawdownMax: -5.6, sharpeRatio: 1.89, sortinoRatio: 2.45, calmarRatio: 16.0, positionsOpen: 12, lastTradeTime: '2025-06-23 14:31:42', alertCount: 0 },
  { monitorId: 'MON-003', strategyName: '跨交易所价差套利', category: 'statistical', status: 'normal', todayPnl: 1560, weekPnl: 8500, monthPnl: 28000, totalPnL: 45600, dailyReturns: Array.from({ length: 30 }, () => Number((Math.random() * 3).toFixed(2))), drawdownCurrent: -0.8, drawdownMax: -2.8, sharpeRatio: 3.12, sortinoRatio: 4.25, calmarRatio: 55.7, positionsOpen: 8, lastTradeTime: '2025-06-23 14:33:01', alertCount: 0 },
  { monitorId: 'MON-004', strategyName: 'AI做市策略Pro', category: 'reversal', status: 'normal', todayPnl: 678, weekPnl: 4200, monthPnl: 15800, totalPnL: 67800, dailyReturns: Array.from({ length: 30 }, () => Number((Math.random() * 2 - 0.3).toFixed(2))), drawdownCurrent: -0.5, drawdownMax: -3.5, sharpeRatio: 2.78, sortinoRatio: 3.65, calmarRatio: 39.7, positionsOpen: 25, lastTradeTime: '2025-06-23 14:33:08', alertCount: 1 },
  { monitorId: 'MON-005', strategyName: '动量反转Alpha', category: 'momentum', status: 'warning', todayPnl: -520, weekPnl: -1800, monthPnl: -6500, totalPnL: -12500, dailyReturns: Array.from({ length: 30 }, () => Number((Math.random() * 4 - 2.5).toFixed(2))), drawdownCurrent: -12.5, drawdownMax: -22.5, sharpeRatio: -0.32, sortinoRatio: -0.48, calmarRatio: -0.6, positionsOpen: 2, lastTradeTime: '2025-06-22 18:20:33', alertCount: 5 },
  { monitorId: 'MON-006', strategyName: '高频网格V2', category: 'statistical', status: 'normal', todayPnl: 1230, weekPnl: 7500, monthPnl: 26800, totalPnL: 112300, dailyReturns: Array.from({ length: 30 }, () => Number((Math.random() * 5 - 0.8).toFixed(2))), drawdownCurrent: -2.5, drawdownMax: -6.8, sharpeRatio: 2.05, sortinoRatio: 2.72, calmarRatio: 16.5, positionsOpen: 18, lastTradeTime: '2025-06-23 14:32:55', alertCount: 0 },
  { monitorId: 'MON-007', strategyName: 'AIOPC多因子选币', category: 'momentum', status: 'normal', todayPnl: 450, weekPnl: 2300, monthPnl: 8900, totalPnL: 0, dailyReturns: Array.from({ length: 30 }, () => Number((Math.random() * 3 - 0.5).toFixed(2))), drawdownCurrent: -1.2, drawdownMax: -4.5, sharpeRatio: 1.68, sortinoRatio: 2.21, calmarRatio: 14.9, positionsOpen: 3, lastTradeTime: '2025-06-23 13:45:12', alertCount: 0 },
  { monitorId: 'MON-008', strategyName: '波动率均值回归', category: 'reversal', status: 'normal', todayPnl: 780, weekPln: 4100, monthPnl: 15200, totalPnL: 78500, dailyReturns: Array.from({ length: 30 }, () => Number((Math.random() * 4 - 0.6).toFixed(2))), drawdownCurrent: -1.5, drawdownMax: -4.9, sharpeRatio: 1.68, sortinoRatio: 2.22, calmarRatio: 16.0, positionsOpen: 6, lastTradeTime: '2025-06-23 14:30:20', alertCount: 0 },
  { monitorId: 'MON-009', strategyName: '趋势增强Beta', category: 'momentum', status: 'danger', todayPnl: -1280, weekPnl: -5200, monthPnl: -12800, totalPnL: -25600, dailyReturns: Array.from({ length: 30 }, () => Number((Math.random() * 5 - 3).toFixed(2))), drawdownCurrent: -18.5, drawdownMax: -28.2, sharpeRatio: -0.85, sortinoRatio: -1.25, calmarRatio: -0.9, positionsOpen: 1, lastTradeTime: '2025-06-21 10:15:44', alertCount: 12 },
  { monitorId: 'MON-010', strategyName: '套利组合策略', category: 'statistical', status: 'offline', todayPnl: 0, weekPnl: 0, monthPnl: 3400, totalPnL: 21500, dailyReturns: Array.from({ length: 30 }, (_, i) => i > 25 ? 0 : Number((Math.random() * 2).toFixed(2))), drawdownCurrent: 0, drawdownMax: -3.8, sharpeRatio: 1.92, sortinoRatio: 2.54, calmarRatio: 20.5, positionsOpen: 0, lastTradeTime: '2025-06-20 23:59:59', alertCount: 2 },
];

const categoryMap: Record<string, string> = { momentum: '动量策略', reversal: '反转策略', statistical: '统计套利' };
const categoryColor: Record<string, string> = { momentum: 'blue', reversal: 'purple', statistical: 'green' };
const statusConfig: Record<string, { label: string; color: string; icon?: React.ReactNode }> = {
  normal: { label: '正常', color: 'success' },
  warning: { label: '预警', color: 'warning' },
  danger: { label: '危险', color: 'error' },
  offline: { label: '离线', color: 'default' },
};

const mockPositions = [
  { symbol: 'BTC/USDT', side: '多头', size: 2.5, entryPrice: 67500, currentPrice: 69200, unrealizedPnl: 4250, weight: '35%' },
  { symbol: 'ETH/USDT', side: '多头', size: 15, entryPrice: 3450, currentPrice: 3580, unrealizedPnl: 1950, weight: '25%' },
  { symbol: 'SOL/USDT', side: '空头', size: 80, entryPrice: 148, currentPrice: 142, unrealizedPnl: 480, weight: '20%' },
  { symbol: 'BNB/USDT', side: '多头', size: 10, entryPrice: 580, currentPrice: 595, unrealizedPnl: 150, weight: '12%' },
  { symbol: 'DOT/USDT', side: '多头', size: 200, entryPrice: 6.8, currentPrice: 7.1, unrealizedPnl: 60, weight: '8%' },
];

const mockAlerts = [
  { time: '2025-06-23 14:30', level: 'info', message: '策略 MON-004 持仓集中度达82%，接近阈值', handled: false },
  { time: '2025-06-23 12:15', level: 'warning', message: 'MON-005 单日回撤超5%，触发黄色预警', handled: false },
  { time: '2025-06-23 10:00', level: 'danger', message: 'MON-009 连续亏损第7天，建议立即检查', handled: false },
  { time: '2025-06-22 18:30', level: 'warning', message: 'MON-005 夏普比率跌破0，进入观察期', handled: true },
  { time: '2025-06-22 09:00', level: 'info', message: 'MON-010 策略离线超过48小时', handled: true },
];

export default function QuantPerformancePage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<any>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredData = mockPerformance.filter(item => {
    if (categoryFilter && item.category !== categoryFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    return true;
  });

  const normalCount = mockPerformance.filter(m => m.status === 'normal').length;
  const warningCount = mockPerformance.filter(m => m.status === 'warning' || m.status === 'danger').length;
  const todayTotalPnl = (mockPerformance || []).reduce((s, m) => s + (m.todayPnl ?? 0), 0);
  const avgSharpe = (mockPerformance.filter(m => m.status !== 'offline').reduce((s, m) => s + m.sharpeRatio, 0) / mockPerformance.filter(m => m.status !== 'offline').length || 0).toFixed(2);

  const columns = [
    { title: '监控ID', dataIndex: 'monitorId', key: 'monitorId', width: 95, render: (t: string) => <span className="font-mono text-xs">{t}</span> },
    { title: '策略名称', dataIndex: 'strategyName', key: 'strategyName', width: 175, render: (t: string) => <span className="font-semibold text-blue-600">{t}</span> },
    {
      title: '分类', dataIndex: 'category', key: 'category', width: 95,
      render: (c: string) => <Tag color={categoryColor[c]}>{categoryMap[c]}</Tag>,
    },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 80,
      render: (s: string) => <Tag color={statusConfig[s]?.color} icon={s === 'danger' ? <WarningOutlined /> : undefined}>{statusConfig[s]?.label}</Tag>,
    },
    {
      title: '今日盈亏($)', dataIndex: 'todayPnl', key: 'todayPnl', width: 110,
      render: (v: number) => <span className={`font-semibold ${v >= 0 ? 'text-green-600' : 'text-red-600'}`}>{v >= 0 ? '+' : ''}${v.toLocaleString()}</span>,
    },
    {
      title: '本周盈亏($)', dataIndex: 'weekPnl', key: 'weekPnl', width: 110,
      render: (v: number) => <span className={v >= 0 ? 'text-green-600' : 'text-red-600'}>{v >= 0 ? '+' : ''}${v.toLocaleString()}</span>,
    },
    {
      title: '本月盈亏($)', dataIndex: 'monthPnl', key: 'monthPnl', width: 110,
      render: (v: number) => <span className={v >= 0 ? 'text-green-600' : 'text-red-600'}>{v >= 0 ? '+' : ''}${v.toLocaleString()}</span>,
    },
    {
      title: '累计盈亏($)', dataIndex: 'totalPnl', key: 'totalPnl', width: 115,
      render: (v: number) => <span className={`font-semibold ${v >= 0 ? 'text-green-600' : 'text-red-600'}`}>{v >= 0 ? '+' : ''}${v.toLocaleString()}</span>,
    },
    { title: '当前回撤(%)', dataIndex: 'drawdownCurrent', key: 'drawdownCurrent', width: 105, render: (v: number) => <span className={v <= -10 ? 'text-red-600 font-semibold' : 'text-orange-500'}>{v}%</span> },
    { title: '最大回撤(%)', dataIndex: 'drawdownMax', key: 'drawdownMax', width: 100, render: (v: number) => <span className="text-red-500">{v}%</span> },
    { title: '夏普比率', dataIndex: 'sharpeRatio', key: 'sharpeRatio', width: 95, render: (v: number) => <span className={v >= 2 ? 'text-green-600' : v >= 1 ? 'text-orange-500' : 'text-red-600'}>{v.toFixed(2)}</span> },
    { title: '索提诺', dataIndex: 'sortinoRatio', key: 'sortinoRatio', width: 80, render: (v: number) => v.toFixed(2) },
    { title: '卡尔玛', dataIndex: 'calmarRatio', key: 'calmarRatio', width: 80, render: (v: number) => v.toFixed(1) },
    { title: '持仓数', dataIndex: 'positionsOpen', key: 'positionsOpen', width: 70 },
    { title: '最后交易', dataIndex: 'lastTradeTime', key: 'lastTradeTime', width: 155 },
    {
      title: '告警数', dataIndex: 'alertCount', key: 'alertCount', width: 75,
      render: (v: number) => v > 0 ? <Tag color={v > 5 ? 'error' : 'warning'}><BellOutlined /> {v}</Tag> : <span className="text-gray-400">0</span>,
    },
  ];

  const actions: any[] = [
    { key: 'view', label: '查看详情', icon: <EyeOutlined />, onClick: (record: any) => { setSelectedMonitor(record); setDetailModalOpen(true); } },
    { key: 'report', label: '绩效报告', icon: <FileTextOutlined />, onClick: (record: any) => message.info(`生成 ${record.strategyName} 绩效报告`) },
    { key: 'rebalance', label: '调仓', icon: <FundOutlined />, onClick: (record: any) => message.success(`${record.strategyName} 调仓指令已发送`) },
    { key: 'alert', label: '告警设置', icon: <BellOutlined />, onClick: (record: any) => message.info(`配置 ${record.strategyName} 告警规则`) },
  ];

  const positionColumns = [
    { title: '交易对', dataIndex: 'symbol', key: 'symbol', render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '方向', dataIndex: 'side', key: 'side', width: 70, render: (s: string) => <Tag color={s === '多头' ? 'green' : 'red'}>{s}</Tag> },
    { title: '数量', dataIndex: 'size', key: 'size' },
    { title: '入场价($)', dataIndex: 'entryPrice', key: 'entryPrice' },
    { title: '现价($)', dataIndex: 'currentPrice', key: 'currentPrice' },
    { title: '未实现盈亏($)', dataIndex: 'unrealizedPnl', key: 'unrealizedPnl', render: (v: number) => <span className={v >= 0 ? 'text-green-600' : 'text-red-600'}>{v >= 0 ? '+' : ''}{v}</span> },
    { title: '权重', dataIndex: 'weight', key: 'weight' },
  ];

  const alertColumns = [
    { title: '时间', dataIndex: 'time', key: 'time', width: 140 },
    { title: '级别', dataIndex: 'level', key: 'level', width: 80, render: (l: string) => <Tag color={l === 'danger' ? 'error' : l === 'warning' ? 'warning' : 'default'}>{l === 'danger' ? '严重' : l === 'warning' ? '警告' : '信息'}</Tag> },
    { title: '告警内容', dataIndex: 'message', key: 'message' },
    { title: '状态', dataIndex: 'handled', key: 'handled', width: 80, render: (h: boolean) => h ? <Tag color="success">已处理</Tag> : <Tag color="processing">待处理</Tag> },
  ];

  // AIOPC健康度5维评分计算
  const getHealthScore = (record: any) => {
    const sharpness = Math.min(100, Math.round(Math.max(0, record.sharpeRatio * 25)));
    const drawdown = Math.min(100, Math.round(Math.max(0, (10 + record.drawdownMax) * 5)));
    const stability = Math.min(100, Math.round(record.sortinoRatio * 25));
    const efficiency = Math.min(100, Math.round(record.calmarRatio * 2.5));
    const activity = Math.min(100, record.positionsOpen * 4 + (record.alertCount === 0 ? 40 : 20));
    return { sharpness, drawdown, stability, efficiency, activity };
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <DashboardOutlined style={{ fontSize: 28, color: '#F0B90B' }} />
              <h1 className="text-2xl font-bold m-0">策略绩效监控中心</h1>
              <Tag color="#F0B90B" style={{ border: 'none', color: '#000', fontWeight: 600 }}>AIOPC</Tag>
            </div>
            <p className="text-gray-500 text-sm mt-2 ml-11">实时策略表现追踪 · 多维度绩效归因 · AIOPC智能预警</p>
          </div>
          <Space>
            <Button icon={<SettingOutlined />}>告警设置</Button>
            <Button type="primary" style={{ backgroundColor: '#F0B90B', borderColor: '#F0B90B', color: '#000' }} icon={<ThunderboltOutlined />}>导出报告</Button>
          </Space>
        </div>

        {/* DataCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard title="监控策略数" value={mockPerformance.length} icon={<DashboardOutlined />} color="#1677FF" description="全量策略监控" />
          <DataCard title="正常运行" value={normalCount} icon={<LineChartOutlined />} color="#16A34A" suffix={`/${mockPerformance.length}`} description="无异常策略" />
          <DataCard title="异常状态" value={warningCount} icon={<WarningOutlined />} color="#DC2626" description="需关注处理" trend={warningCount > 0 ? 'down' : 'up'} trendValue={warningCount > 0 ? `${warningCount}条` : '良好'} />
          <DataCard title="今日总盈亏" value={todayTotalPnl.toLocaleString()} prefix="$" icon={<TrophyOutlined />} color={todayTotalPnl >= 0 ? '#16A34A' : '#DC2626'} description="所有策略合计" />
          <DataCard title="平均夏普" value={avgSharpe} icon={<SafetyCertificateOutlined />} color="#F0B90B" description="在线策略均值" />
        </div>

        {/* 筛选栏 */}
        <Card size="small">
          <Space wrap>
            <Select placeholder="策略分类" allowClear value={categoryFilter || undefined} onChange={setCategoryFilter} style={{ width: 130 }}>
              <Option value="momentum">动量策略</Option>
              <Option value="reversal">反转策略</Option>
              <Option value="statistical">统计套利</Option>
            </Select>
            <Select placeholder="运行状态" allowClear value={statusFilter || undefined} onChange={setStatusFilter} style={{ width: 120 }}>
              <Option value="normal">正常</Option>
              <Option value="warning">预警</Option>
              <Option value="danger">危险</Option>
              <Option value="offline">离线</Option>
            </Select>
            <Tag icon={<FilterOutlined />} color="processing">共 {filteredData.length} 条</Tag>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable columns={columns as any} dataSource={filteredData as any} rowKey="monitorId" actions={actions} />

        {/* 详情弹窗 */}
        <Modal
          title={
            <Space>
              <DashboardOutlined style={{ color: '#F0B90B' }} />
              <span>{selectedMonitor?.strategyName} - 绩效详情</span>
              <Tag color={statusConfig[selectedMonitor?.status]?.color}>{statusConfig[selectedMonitor?.status]?.label}</Tag>
            </Space>
          }
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
            <Button key="report" icon={<FileTextOutlined />}>生成报告</Button>,
            <Button key="rebalance" type="primary" style={{ backgroundColor: '#F0B90B', borderColor: '#F0B90B', color: '#000' }} icon={<FundOutlined />}>执行调仓</Button>,
          ]}
          width={950}
        >
          {selectedMonitor && (() => {
            const health = getHealthScore(selectedMonitor);
            const overallHealth = Math.round((health.sharpness + health.drawdown + health.stability + health.efficiency + health.activity) / 5);

            return (
              <div className="space-y-4">
                {/* 实时数据 */}
                <Card size="small" title="实时绩效数据">
                  <Descriptions column={4} size="small">
                    <Descriptions.Item label="今日盈亏"><span className={`font-bold text-lg ${selectedMonitor.todayPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>${selectedMonitor.todayPnl.toLocaleString()}</span></Descriptions.Item>
                    <Descriptions.Item label="本周盈亏"><span className={selectedMonitor.weekPnl >= 0 ? 'text-green-600' : 'text-red-600'}>${selectedMonitor.weekPnl.toLocaleString()}</span></Descriptions.Item>
                    <Descriptions.Item label="本月盈亏"><span className={selectedMonitor.monthPnl >= 0 ? 'text-green-600' : 'text-red-600'}>${selectedMonitor.monthPnl.toLocaleString()}</span></Descriptions.Item>
                    <Descriptions.Item label="累计盈亏"><span className={`font-bold ${selectedMonitor.totalPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>${selectedMonitor.totalPnl.toLocaleString()}</span></Descriptions.Item>
                    <Descriptions.Item label="当前回撤"><span className={selectedMonitor.drawdownCurrent <= -10 ? 'text-red-600 font-semibold' : 'text-orange-500'}>{selectedMonitor.drawdownCurrent}%</span></Descriptions.Item>
                    <Descriptions.Item label="最大回撤"><span className="text-red-500">{selectedMonitor.drawdownMax}%</span></Descriptions.Item>
                    <Descriptions.Item label="最后交易">{selectedMonitor.lastTradeTime}</Descriptions.Item>
                    <Descriptions.Item label="持仓数量">{selectedMonitor.positionsOpen} 个</Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* 风险指标 */}
                <Card size="small" title="核心风险指标">
                  <Descriptions column={4} size="small">
                    <Descriptions.Item label="夏普比率"><span className={selectedMonitor.sharpeRatio >= 2 ? 'text-green-600 font-semibold' : selectedMonitor.sharpeRatio >= 1 ? 'text-orange-500' : 'text-red-600'}>{selectedMonitor.sharpeRatio.toFixed(2)}</span></Descriptions.Item>
                    <Descriptions.Item label="索提诺比率">{selectedMonitor.sortinoRatio.toFixed(2)}</Descriptions.Item>
                    <Descriptions.Item label="卡尔玛比率">{selectedMonitor.calmarRatio.toFixed(1)}</Descriptions.Item>
                    <Descriptions.Item label="未处理告警">{selectedMonitor.alertCount > 0 ? <Tag color="warning">{selectedMonitor.alertCount} 条</Tag> : <Tag color="success">无</Tag>}</Descriptions.Item>
                  </Descriptions>
                </Card>

                {/* AIOPC健康度评估 - 5维进度条 */}
                <Card size="small" title={<Space><SafetyCertificateOutlined style={{ color: '#F0B90B' }} /><span>AIOPC 健康度评估（5维度）</span></Space>} style={{ borderColor: '#F0B90B' }}>
                  <div className="flex items-center gap-6 mb-4">
                    <div className="text-center">
                      <div style={{ fontSize: 36, fontWeight: 700, color: overallHealth >= 70 ? '#16A34A' : overallHealth >= 40 ? '#F59E0B' : '#DC2626' }}>{overallHealth}</div>
                      <div className="text-gray-500 text-sm">综合得分</div>
                    </div>
                    <Divider type="vertical" style={{ height: 60 }} />
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-sm text-gray-500">夏普强度</span>
                        <Progress percent={health.sharpness} strokeColor="#1677FF" size="small" showInfo format={p => <span className="text-xs">{p}</span>} style={{ flex: 1 }} />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-sm text-gray-500">回撤控制</span>
                        <Progress percent={health.drawdown} strokeColor={health.drawdown >= 60 ? '#16A34A' : health.drawdown >= 30 ? '#F59E0B' : '#DC2626'} size="small" showInfo format={p => <span className="text-xs">{p}</span>} style={{ flex: 1 }} />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-sm text-gray-500">稳定性</span>
                        <Progress percent={health.stability} strokeColor="#7C3AED" size="small" showInfo format={p => <span className="text-xs">{p}</span>} style={{ flex: 1 }} />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-sm text-gray-500">效率比</span>
                        <Progress percent={health.efficiency} strokeColor="#16A34A" size="small" showInfo format={p => <span className="text-xs">{p}</span>} style={{ flex: 1 }} />
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="w-20 text-sm text-gray-500">活跃度</span>
                        <Progress percent={health.activity} strokeColor="#F59E0B" size="small" showInfo format={p => <span className="text-xs">{p}</span>} style={{ flex: 1 }} />
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mt-2">
                    {overallHealth >= 80 ? '🟢 策略运行健康，各项指标表现优异，继续保持当前配置。'
                      : overallHealth >= 50 ? '🟡 策略存在一定风险因素，建议关注回撤控制和交易频率优化。'
                      : '🔴 策略健康状况堪忧，强烈建议暂停并重新评估策略逻辑和参数配置。'}
                  </p>
                </Card>

                {/* 近30日收益描述 */}
                <Card size="small" title="近30日收益走势分析">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    近30个交易日中，{selectedMonitor.dailyReturns.filter(r => r > 0).length}天盈利，{selectedMonitor.dailyReturns.filter(r => r <= 0).length}天亏损，
                    日均收益率为<span className={selectedMonitor.monthPnl > 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                      {(selectedMonitor.monthPnl / 30).toFixed(2)}%
                    </span>。
                    最大单日盈利+<span className="text-green-600">{Math.max(...selectedMonitor.dailyReturns).toFixed(2)}%</span>，
                    最大单日亏损<span className="text-red-600">{Math.min(...selectedMonitor.dailyReturns).toFixed(2)}%</span>。
                    收益标准差约为{(Math.sqrt(selectedMonitor.dailyReturns.reduce((s, r) => s + r * r, 0) / 30)).toFixed(2)}%，
                    波动性处于{selectedMonitor.sharpeRatio > 2 ? '较低水平，策略稳定' : '中等水平，需关注'}。
                  </p>
                </Card>

                {/* 持仓明细 */}
                <Card size="small" title="当前持仓明细">
                  <Table dataSource={mockPositions} columns={positionColumns} rowKey="symbol" pagination={false} size="small" />
                </Card>

                {/* 告警记录 */}
                <Card size="small" title="近期告警记录">
                  <Table dataSource={mockAlerts} columns={alertColumns} rowKey="time" pagination={false} size="small" />
                </Card>
              </div>
            );
          })()}
        </Modal>
      </div>
    </AdminLayout>
  );
}
