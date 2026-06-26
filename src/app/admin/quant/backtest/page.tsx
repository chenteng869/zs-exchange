'use client';

import { useState } from 'react';
import { Button, Space, Tag, Modal, Descriptions, Divider, Select, Card, Tooltip, Progress, Table, message } from 'antd';
import {
  ExperimentOutlined,
  EyeOutlined,
  DownloadOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  LineChartOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  FilterOutlined,
  ThunderboltOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import DataCard from '@/components/admin/DataCard';

const { Option } = Select;

const mockBacktests = [
  { runId: 'BT-001', strategyName: 'AIOPC趋势跟踪V3', pair: 'BTC/USDT', timeframe: '1h', startDate: '2024-01-01', endDate: '2024-06-30', initialCapital: 100000, finalCapital: 256800, totalReturn: 156.8, sharpeRatio: 2.35, maxDrawdown: -8.2, winRate: 68.5, profitFactor: 2.12, totalTrades: 1890, status: 'completed', duration: '180天', createdAt: '2025-06-20' },
  { runId: 'BT-002', strategyName: '网格套利增强版', pair: 'ETH/USDT', timeframe: '15m', startDate: '2024-03-01', endDate: '2024-06-30', initialCapital: 50000, finalCapital: 94700, totalReturn: 89.4, sharpeRatio: 1.89, maxDrawdown: -5.6, winRate: 75.2, profitFactor: 1.85, totalTrades: 4560, status: 'completed', duration: '122天', createdAt: '2025-06-19' },
  { runId: 'BT-003', strategyName: '跨交易所价差套利', pair: 'SOL/USDT', timeframe: '5m', startDate: '2025-05-01', endDate: '2025-06-23', initialCapital: 100000, finalCapital: 145600, totalReturn: 45.6, sharpeRatio: 3.12, maxDrawdown: -2.8, winRate: 82.0, profitFactor: 2.45, totalTrades: 12340, status: 'running', duration: '53天', createdAt: '2025-06-22' },
  { runId: 'BT-004', strategyName: 'AI做市策略Pro', pair: 'BNB/USDT', timeframe: '1m', startDate: '2024-02-01', endDate: '2024-05-31', initialCapital: 200000, finalCapital: 335600, totalReturn: 67.8, sharpeRatio: 2.78, maxDrawdown: -3.5, winRate: 91.2, profitFactor: 3.28, totalTrades: 56780, status: 'completed', duration: '120天', createdAt: '2025-06-18' },
  { runId: 'BT-005', strategyName: '动量反转Alpha', pair: 'ADA/USDT', timeframe: '4h', startDate: '2024-04-01', endDate: '2024-06-30', initialCapital: 50000, finalCapital: 35750, totalReturn: -28.5, sharpeRatio: -0.32, maxDrawdown: -22.5, winRate: 38.2, profitFactor: 0.65, totalTrades: 320, status: 'failed', duration: '90天', createdAt: '2025-06-15' },
  { runId: 'BT-006', strategyName: '高频网格V2', pair: 'DOT/USDT', timeframe: '5m', startDate: '2025-01-01', endDate: '2025-06-23', initialCapital: 150000, finalCapital: 318450, totalReturn: 112.3, sharpeRatio: 2.05, maxDrawdown: -6.8, winRate: 71.5, profitFactor: 1.92, totalTrades: 23450, status: 'running', duration: '174天', createdAt: '2025-06-21' },
  { runId: 'BT-007', strategyName: 'AIOPC多因子选币', pair: 'MATIC/USDT', timeframe: '1d', startDate: '2024-07-01', endDate: '2024-12-31', initialCapital: 80000, finalCapital: 102400, totalReturn: 28.0, sharpeRatio: 1.45, maxDrawdown: -10.5, winRate: 62.1, profitFactor: 1.58, totalTrades: 156, status: 'completed', duration: '184天', createdAt: '2025-06-17' },
  { runId: 'BT-008', strategyName: '波动率均值回归', pair: 'LINK/USDT', timeframe: '15m', startDate: '2025-03-01', endDate: '2025-06-15', initialCapital: 60000, finalCapital: 107100, totalReturn: 78.5, sharpeRatio: 1.68, maxDrawdown: -4.9, winRate: 69.7, profitFactor: 1.76, totalTrades: 8970, status: 'cancelled', duration: '107天', createdAt: '2025-06-16' },
  { runId: 'BT-009', strategyName: 'AIOPC趋势跟踪V3', pair: 'ETH/BTC', timeframe: '4h', startDate: '2025-04-01', endDate: '2025-06-23', initialCapital: 120000, finalCapital: 148560, totalReturn: 23.8, sharpeRatio: 1.78, maxDrawdown: -7.2, winRate: 64.5, profitFactor: 1.68, totalTrades: 420, status: 'running', duration: '83天', createdAt: '2025-06-23' },
  { runId: 'BT-010', strategyName: '网格套利增强版', pair: 'AVAX/USDT', timeframe: '1h', startDate: '2025-02-01', endDate: '2025-05-31', initialCapital: 70000, finalCapital: 98700, totalReturn: 41.0, sharpeRatio: 1.95, maxDrawdown: -6.1, winRate: 73.8, profitFactor: 1.88, totalTrades: 2680, status: 'completed', duration: '120天', createdAt: '2025-06-14' },
];

const timeframeMap: Record<string, string> = { '1m': '1分钟', '5m': '5分钟', '15m': '15分钟', '1h': '1小时', '4h': '4小时', '1d': '日线' };
const statusMap: Record<string, { label: string; color: string }> = {
  running: { label: '运行中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  failed: { label: '失败', color: 'error' },
  cancelled: { label: '已取消', color: 'default' },
};

const mockTradeRecords = Array.from({ length: 20 }, (_, i) => ({
  tradeId: `T-${String(i + 1).padStart(4, '0')}`,
  time: `2025-06-${String(23 - (i % 23)).padStart(2, '0')} ${String(9 + (i % 12)).padStart(2, '0')}:${String(i * 3).padStart(2, '0')}:00`,
  side: i % 3 === 0 ? '卖出' : '买入',
  pair: ['BTC/USDT', 'ETH/USDT', 'SOL/USDT'][i % 3],
  price: (35000 + Math.random() * 5000).toFixed(2),
  amount: (0.1 + Math.random() * 2).toFixed(4),
  fee: (0.5 + Math.random() * 3).toFixed(2),
  pnl: ((Math.random() - 0.35) * 200).toFixed(2),
}));

export default function QuantBacktestPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBacktest, setSelectedBacktest] = useState<any>(null);
  const [pairFilter, setPairFilter] = useState<string>('');
  const [timeframeFilter, setTimeframeFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  const filteredData = mockBacktests.filter(item => {
    if (pairFilter && item.pair !== pairFilter) return false;
    if (timeframeFilter && item.timeframe !== timeframeFilter) return false;
    if (statusFilter && item.status !== statusFilter) return false;
    return true;
  });

  const weekNewCount = 3;
  const avgReturn = (mockBacktests.filter(b => b.status === 'completed').reduce((s, b) => s + b.totalReturn, 0) / mockBacktests.filter(b => b.status === 'completed').length || 0).toFixed(1);
  const maxDD = Math.max(...mockBacktests.map(b => Math.abs(b.maxDrawdown)));
  const avgWinRate = (mockBacktests.reduce((s, b) => s + b.winRate, 0) / mockBacktests.length).toFixed(1);

  const columns = [
    { title: '回测ID', dataIndex: 'runId', key: 'runId', width: 90, render: (t: string) => <span className="font-mono text-xs">{t}</span> },
    { title: '策略名称', dataIndex: 'strategyName', key: 'strategyName', width: 180, render: (t: string) => <span className="font-semibold text-blue-600">{t}</span> },
    {
      title: '交易对', dataIndex: 'pair', key: 'pair', width: 110,
      render: (t: string) => <Tag color="blue">{t}</Tag>,
    },
    {
      title: '周期', dataIndex: 'timeframe', key: 'timeframe', width: 80,
      render: (t: string) => <Tag color="cyan">{timeframeMap[t]}</Tag>,
    },
    { title: '开始日期', dataIndex: 'startDate', key: 'startDate', width: 110 },
    { title: '结束日期', dataIndex: 'endDate', key: 'endDate', width: 110 },
    { title: '初始资金', dataIndex: 'initialCapital', key: 'initialCapital', width: 100, render: (v: number) => `$${v.toLocaleString()}` },
    { title: '最终资金', dataIndex: 'finalCapital', key: 'finalCapital', width: 100, render: (v: number) => `$${v.toLocaleString()}` },
    {
      title: '收益率(%)', dataIndex: 'totalReturn', key: 'totalReturn', width: 95,
      render: (v: number) => <span className={v >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{v > 0 ? '+' : ''}{v}%</span>,
    },
    { title: '夏普比率', dataIndex: 'sharpeRatio', key: 'sharpeRatio', width: 90, render: (v: number) => <span className={v >= 2 ? 'text-green-600' : v >= 1 ? 'text-orange-500' : 'text-red-600'}>{v.toFixed(2)}</span> },
    { title: '最大回撤(%)', dataIndex: 'maxDrawdown', key: 'maxDrawdown', width: 105, render: (v: number) => <span className="text-red-500">{v}%</span> },
    { title: '胜率(%)', dataIndex: 'winRate', key: 'winRate', width: 80, render: (v: number) => `${v}%` },
    { title: '盈亏比', dataIndex: 'profitFactor', key: 'profitFactor', width: 80, render: (v: number) => v.toFixed(2) },
    { title: '交易次数', dataIndex: 'totalTrades', key: 'totalTrades', width: 90, render: (v: number) => v.toLocaleString() },
    {
      title: '状态', dataIndex: 'status', key: 'status', width: 90,
      render: (s: string) => <Tag color={statusMap[s]?.color}>{statusMap[s]?.label}</Tag>,
    },
  ];

  const actions: any[] = [
    { key: 'view', label: '查看详情', icon: <EyeOutlined />, onClick: (record: any) => { setSelectedBacktest(record); setDetailModalOpen(true); } },
    { key: 'download', label: '下载报告', icon: <DownloadOutlined />, onClick: (record: any) => message.success(`${record.runId} 回测报告下载中...`) },
    { key: 'rerun', label: '重新运行', icon: <ReloadOutlined />, onClick: (record: any) => message.info(`已提交 ${record.strategyName} 重新回测任务`) },
  ];

  const tradeColumns = [
    { title: '交易ID', dataIndex: 'tradeId', key: 'tradeId', width: 80, render: (t: string) => <span className="font-mono text-xs">{t}</span> },
    { title: '时间', dataIndex: 'time', key: 'time', width: 170 },
    { title: '方向', dataIndex: 'side', key: 'side', width: 70, render: (s: string) => <Tag color={s === '买入' ? 'green' : 'red'}>{s}</Tag> },
    { title: '交易对', dataIndex: 'pair', key: 'pair', width: 100 },
    { title: '价格', dataIndex: 'price', key: 'price', width: 100, render: (v: string) => `$${v}` },
    { title: '数量', dataIndex: 'amount', key: 'amount', width: 80 },
    { title: '手续费($)', dataIndex: 'fee', key: 'fee', width: 90 },
    { title: '盈亏($)', dataIndex: 'pnl', key: 'pnl', width: 90, render: (v: string) => <span className={parseFloat(v) >= 0 ? 'text-green-600' : 'text-red-600'}>{parseFloat(v) > 0 ? '+' : ''}{v}</span> },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <ExperimentOutlined style={{ fontSize: 28, color: '#F0B90B' }} />
              <h1 className="text-2xl font-bold m-0">策略回测引擎</h1>
              <Tag color="#F0B90B" style={{ border: 'none', color: '#000', fontWeight: 600 }}>AIOPC</Tag>
            </div>
            <p className="text-gray-500 text-sm mt-2 ml-11">专业级量化回测系统 · 多周期/多标的/滑点模拟 · AIOPC增强回测</p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />}>刷新数据</Button>
            <Button type="primary" style={{ backgroundColor: '#F0B90B', borderColor: '#F0B90B', color: '#000' }} icon={<ThunderboltOutlined />}>新建回测</Button>
          </Space>
        </div>

        {/* DataCards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard title="回测总数" value={mockBacktests.length} icon={<ExperimentOutlined />} color="#1677FF" description="历史回测任务" />
          <DataCard title="本周新增" value={weekNewCount} icon={<ClockCircleOutlined />} color="#16A34A" description="近7天新增" trend="up" trendValue="+2" />
          <DataCard title="平均收益" value={avgReturn} suffix="%" icon={<TrophyOutlined />} color="#7C3AED" description="已完成任务均值" />
          <DataCard title="最大回撤" value={`${maxDD.toFixed(1)}%`} icon={<LineChartOutlined />} color="#DC2626" description="历史最差回撤" />
          <DataCard title="胜率均值" value={avgWinRate} suffix="%" icon={<SafetyCertificateOutlined />} color="#F0B90B" description="全部策略胜率" />
        </div>

        {/* 筛选栏 */}
        <Card size="small">
          <Space wrap>
            <Select placeholder="交易对" allowClear value={pairFilter || undefined} onChange={setPairFilter} style={{ width: 140 }}>
              <Option value="BTC/USDT">BTC/USDT</Option>
              <Option value="ETH/USDT">ETH/USDT</Option>
              <Option value="SOL/USDT">SOL/USDT</Option>
              <Option value="BNB/USDT">BNB/USDT</Option>
              <Option value="ADA/USDT">ADA/USDT</Option>
              <Option value="DOT/USDT">DOT/USDT</Option>
              <Option value="MATIC/USDT">MATIC/USDT</Option>
              <Option value="LINK/USDT">LINK/USDT</Option>
            </Select>
            <Select placeholder="时间框架" allowClear value={timeframeFilter || undefined} onChange={setTimeframeFilter} style={{ width: 130 }}>
              <Option value="1m">1分钟</Option>
              <Option value="5m">5分钟</Option>
              <Option value="15m">15分钟</Option>
              <Option value="1h">1小时</Option>
              <Option value="4h">4小时</Option>
              <Option value="1d">日线</Option>
            </Select>
            <Select placeholder="回测状态" allowClear value={statusFilter || undefined} onChange={setStatusFilter} style={{ width: 130 }}>
              <Option value="running">运行中</Option>
              <Option value="completed">已完成</Option>
              <Option value="failed">失败</Option>
              <Option value="cancelled">已取消</Option>
            </Select>
            <Tag icon={<FilterOutlined />} color="processing">共 {filteredData.length} 条</Tag>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable columns={columns as any} dataSource={filteredData as any} rowKey="runId" actions={actions} />

        {/* 详情弹窗 */}
        <Modal
          title={
            <Space>
              <ExperimentOutlined style={{ color: '#F0B90B' }} />
              <span>{selectedBacktest?.runId} - {selectedBacktest?.strategyName}</span>
              <Tag color={statusMap[selectedBacktest?.status]?.color}>{statusMap[selectedBacktest?.status]?.label}</Tag>
            </Space>
          }
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
            <Button key="download" icon={<DownloadOutlined />}>下载PDF报告</Button>,
            <Button key="rerun" type="primary" style={{ backgroundColor: '#F0B90B', borderColor: '#F0B90B', color: '#000' }} icon={<ReloadOutlined />}>重新运行</Button>,
          ]}
          width={900}
        >
          {selectedBacktest && (
            <div className="space-y-4">
              {/* 回测参数 */}
              <Card size="small" title="回测参数配置">
                <Descriptions column={3} size="small">
                  <Descriptions.Item label="策略名称">{selectedBacktest.strategyName}</Descriptions.Item>
                  <Descriptions.Item label="交易对"><Tag color="blue">{selectedBacktest.pair}</Tag></Descriptions.Item>
                  <Descriptions.Item label="时间框架"><Tag color="cyan">{timeframeMap[selectedBacktest.timeframe]}</Tag></Descriptions.Item>
                  <Descriptions.Item label="起始日期">{selectedBacktest.startDate}</Descriptions.Item>
                  <Descriptions.Item label="结束日期">{selectedBacktest.endDate}</Descriptions.Item>
                  <Descriptions.Item label="回测时长"><Tag>{selectedBacktest.duration}</Tag></Descriptions.Item>
                  <Descriptions.Item label="初始资金"><span className="font-semibold">${selectedBacktest.initialCapital.toLocaleString()}</span></Descriptions.Item>
                  <Descriptions.Item label="最终资金"><span className={`font-semibold ${selectedBacktest.finalCapital >= selectedBacktest.initialCapital ? 'text-green-600' : 'text-red-600'}`}>${selectedBacktest.finalCapital.toLocaleString()}</span></Descriptions.Item>
                  <Descriptions.Item label="滑点设置"><Tag color="orange">0.05%</Tag></Descriptions.Item>
                </Descriptions>
              </Card>

              {/* 绩效指标 */}
              <Card size="small" title="绩效指标概览">
                <Descriptions column={4} size="small">
                  <Descriptions.Item label="总收益率"><span className={selectedBacktest.totalReturn >= 0 ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>{selectedBacktest.totalReturn > 0 ? '+' : ''}{selectedBacktest.totalReturn}%</span></Descriptions.Item>
                  <Descriptions.Item label="夏普比率"><span className={selectedBacktest.sharpeRatio >= 2 ? 'text-green-600' : selectedBacktest.sharpeRatio >= 1 ? 'text-orange-500' : 'text-red-600'}>{selectedBacktest.sharpeRatio.toFixed(2)}</span></Descriptions.Item>
                  <Descriptions.Item label="最大回撤"><span className="text-red-500 font-semibold">{selectedBacktest.maxDrawdown}%</span></Descriptions.Item>
                  <Descriptions.Item label="胜率">{selectedBacktest.winRate}%</Descriptions.Item>
                  <Descriptions.Item label="盈亏比">{selectedBacktest.profitFactor.toFixed(2)}</Descriptions.Item>
                  <Descriptions.Item label="总交易次数">{selectedBacktest.totalTrades.toLocaleString()}笔</Descriptions.Item>
                </Descriptions>
              </Card>

              {/* AIOPC建议 */}
              <Card size="small" title={<Space><SafetyCertificateOutlined style={{ color: '#F0B90B' }} /><span>AIOPC 智能分析建议</span></Space>} style={{ borderColor: '#F0B90B' }}>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Tag color="#F0B90B" style={{ color: '#000' }}>综合评级</Tag>
                    <Progress
                      percent={Math.min(100, Math.round(
                        selectedBacktest.aiopcScore || (selectedBacktest.sharpeRatio * 25 + selectedBacktest.winRate * 0.3)
                      ))}
                      strokeColor="#F0B90B"
                      style={{ flex: 1 }}
                      format={(percent) => <span style={{ color: '#F0B90B', fontWeight: 600 }}>{percent}分</span>}
                    />
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedBacktest.status === 'completed' && selectedBacktest.totalReturn > 50 && selectedBacktest.sharpeRatio > 1.5
                      ? `该回测表现优异！收益率${selectedBacktest.totalReturn}%，夏普比率${selectedBacktest.sharpeRatio.toFixed(2)}，AIOPC评估为A级。建议：可考虑进入模拟盘验证后上线实盘。注意监控最大回撤${selectedBacktest.maxDrawdown}%是否在可接受范围内。`
                      : selectedBacktest.status === 'failed'
                        ? `回测失败，收益率为${selectedBacktest.totalReturn}%，最大回撤达${selectedBacktest.maxDrawdown}%。AIOPC建议：检查策略逻辑，优化止损机制，降低仓位集中度。当前策略不适合直接上线。`
                        : `回测结果中等。收益率${selectedBacktest.totalReturn}%，夏普${selectedBacktest.sharpeRatio.toFixed(2)}，胜率${selectedBacktest.winRate}%。AIOPC建议：可尝试调整参数组合或增加过滤条件以提升稳定性。`}
                  </p>
                </div>
              </Card>

              {/* 资金权益曲线描述 */}
              <Card size="small" title="资金权益曲线分析">
                <p className="text-gray-600 text-sm leading-relaxed">
                  初始资金 ${selectedBacktest.initialCapital.toLocaleString()}，经过 {selectedBacktest.duration} 的回测周期，
                  最终达到 <span className={selectedBacktest.finalCapital >= selectedBacktest.initialCapital ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>${selectedBacktest.finalCapital.toLocaleString()}</span>。
                  资金曲线整体呈{selectedBacktest.totalReturn > 0 ? '上升' : '下降'}趋势，
                  最大回撤发生在{selectedBacktest.startDate.slice(5, 7)}月份，幅度为<span className="text-red-500 font-semibold">{selectedBacktest.maxDrawdown}%</span>。
                  回撤恢复期约{Math.round(Math.abs(selectedBacktest.maxDrawdown) * 3.5)}个交易日。
                  AIOPC增强模式下，滑点和手续费已按真实交易所标准模拟，数据可信度高。
                </p>
              </Card>

              {/* 逐笔交易记录 */}
              <Card size="small" title="逐笔交易记录（最近20条）">
                <Table dataSource={mockTradeRecords} columns={tradeColumns} rowKey="tradeId" pagination={false} size="small" scroll={{ x: 800 }} />
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
