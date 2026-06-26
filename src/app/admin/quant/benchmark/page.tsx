'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Button, Space, Tag, Modal, message, Descriptions, Select, Table, Card, Tooltip, Progress, Row, Col } from 'antd';
import {
  AimOutlined,
  EyeOutlined,
  ExportOutlined,
  SwapOutlined,
  FlagOutlined,
  DashboardOutlined,
  TrophyOutlined,
  ThunderboltOutlined,
  RiseOutlined,
  FallOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface BenchmarkComparison {
  id: string;
  portfolioName: string;
  benchmark: 'btc' | 'eth' | 'sp500' | 'nasdaq' | 'gold' | 'us_bond';
  period: '1m' | '3m' | '6m' | '1y' | 'ytd' | 'all';
  portfolioReturn: number;
  benchmarkReturn: number;
  alpha: number;
  beta: number;
  trackingError: number;
  informationRatio: number;
  upCapture: number;
  downCapture: number;
  maxDrawdown: number;
  sharpeRatio: number;
  sortinoRatio: number;
  calmarRatio: number;
  comparedAt: string;
}

const mockData: BenchmarkComparison[] = [
  { id: '1', portfolioName: '稳健增长组合A', benchmark: 'btc', period: '1y', portfolioReturn: 85.2, benchmarkReturn: 125.5, alpha: -40.3, beta: 0.65, trackingError: 18.5, informationRatio: -2.18, upCapture: 68, downCapture: 42, maxDrawdown: -12.5, sharpeRatio: 1.85, sortinoRatio: 2.45, calmarRatio: 6.82, comparedAt: '2024-06-23' },
  { id: '2', portfolioName: '稳健增长组合A', benchmark: 'eth', period: '1y', portfolioReturn: 85.2, benchmarkReturn: 98.3, alpha: -13.1, beta: 0.78, trackingError: 15.2, informationRatio: -0.86, upCapture: 75, downCapture: 55, maxDrawdown: -12.5, sharpeRatio: 1.85, sortinoRatio: 2.45, calmarRatio: 6.82, comparedAt: '2024-06-23' },
  { id: '3', portfolioName: '激进增长组合B', benchmark: 'btc', period: 'ytd', portfolioReturn: 42.8, benchmarkReturn: 58.2, alpha: -15.4, beta: 1.25, trackingError: 22.8, informationRatio: -0.68, upCapture: 115, downCapture: 128, maxDrawdown: -22.5, sharpeRatio: 1.42, sortinoRatio: 1.88, calmarRatio: 1.90, comparedAt: '2024-06-23' },
  { id: '4', portfolioName: '激进增长组合B', benchmark: 'nasdaq', period: 'ytd', portfolioReturn: 42.8, benchmarkReturn: 28.5, alpha: 14.3, beta: 1.52, trackingError: 28.5, informationRatio: 0.50, upCapture: 142, downCapture: 135, maxDrawdown: -22.5, sharpeRatio: 1.42, sortinoRatio: 1.88, calmarRatio: 1.90, comparedAt: '2024-06-23' },
  { id: '5', portfolioName: '保守收益组合C', benchmark: 'us_bond', period: '1y', portfolioReturn: 8.5, benchmarkReturn: 5.2, alpha: 3.3, beta: 0.28, trackingError: 6.5, informationRatio: 0.51, upCapture: 145, downCapture: 35, maxDrawdown: -3.2, sharpeRatio: 2.35, sortinoRatio: 3.85, calmarRatio: 2.66, comparedAt: '2024-06-22' },
  { id: '6', portfolioName: 'AIOPC智能组合D', benchmark: 'btc', period: '6m', portfolioReturn: 32.5, benchmarkReturn: 45.8, alpha: -13.3, beta: 0.92, trackingError: 12.5, informationRatio: -1.06, upCapture: 88, downCapture: 72, maxDrawdown: -15.8, sharpeRatio: 1.68, sortinoRatio: 2.24, calmarRatio: 2.06, comparedAt: '2024-06-23' },
  { id: '7', portfolioName: 'AIOPC智能组合D', benchmark: 'gold', period: '6m', portfolioReturn: 32.5, benchmarkReturn: 18.2, alpha: 14.3, beta: 0.45, trackingError: 16.8, informationRatio: 0.85, upCapture: 168, downCapture: 48, maxDrawdown: -15.8, sharpeRatio: 1.68, sortinoRatio: 2.24, calmarRatio: 2.06, comparedAt: '2024-06-23' },
  { id: '8', portfolioName: 'DeFi收益聚合器E', benchmark: 'eth', period: '3m', portfolioReturn: 28.9, benchmarkReturn: 15.5, alpha: 13.4, beta: 1.38, trackingError: 25.2, informationRatio: 0.53, upCapture: 155, downCapture: 118, maxDrawdown: -18.5, sharpeRatio: 1.15, sortinoRatio: 1.52, calmarRatio: 1.56, comparedAt: '2024-06-21' },
  { id: '9', portfolioName: 'Layer2布局组合F', benchmark: 'eth', period: '6m', portfolioReturn: -5.8, benchmarkReturn: 22.5, alpha: -28.3, beta: 1.45, trackingError: 30.5, informationRatio: -0.93, upCapture: 35, downCapture: 165, maxDrawdown: -28.5, sharpeRatio: 0.68, sortinoRatio: 0.90, calmarRatio: -0.20, comparedAt: '2024-06-20' },
  { id: '10', portfolioName: '稳定币收益池G', benchmark: 'us_bond', period: '1y', portfolioReturn: 4.2, benchmarkReturn: 5.2, alpha: -1.0, beta: 0.02, trackingError: 1.2, informationRatio: -0.83, upCapture: 95, downCapture: 5, maxDrawdown: -0.1, sharpeRatio: 4.25, sortinoRatio: 7.85, calmarRatio: 42.00, comparedAt: '2024-06-19' },
  { id: '11', portfolioName: '稳健增长组合A', benchmark: 'sp500', period: '1y', portfolioReturn: 85.2, benchmarkReturn: 24.5, alpha: 60.7, beta: 0.42, trackingError: 32.5, informationRatio: 1.87, upCapture: 285, downCapture: 25, maxDrawdown: -12.5, sharpeRatio: 1.85, sortinoRatio: 2.45, calmarRatio: 6.82, comparedAt: '2024-06-18' },
  { id: '12', portfolioName: '激进增长组合B', benchmark: 'sp500', period: '1y', portfolioReturn: 42.8, benchmarkReturn: 24.5, alpha: 18.3, beta: 1.15, trackingError: 26.8, informationRatio: 0.68, upCapture: 178, downCapture: 125, maxDrawdown: -22.5, sharpeRatio: 1.42, sortinoRatio: 1.88, calmarRatio: 1.90, comparedAt: '2024-06-17' },
];

const benchMap: Record<string, { label: string; color: string }> = {
  btc: { label: 'BTC', color: '#F7931A' },
  eth: { label: 'ETH', color: '#627EEA' },
  sp500: { label: 'S&P500', color: '#16A34A' },
  nasdaq: { label: 'NASDAQ', color: '#1677FF' },
  gold: { label: 'GOLD', color: '#F59E0B' },
  us_bond: { label: 'US Bond', color: '#7C3AED' },
};

const periodMap: Record<string, string> = {
  '1m': '1个月',
  '3m': '3个月',
  '6m': '6个月',
  '1y': '1年',
  ytd: '年初至今',
  all: '全部',
};

export default function BenchmarkPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedBenchmark, setSelectedBenchmark] = useState<BenchmarkComparison | null>(null);
  const [benchFilter, setBenchFilter] = useState<string>('');
  const [periodFilter, setPeriodFilter] = useState<string>('');

  const filteredData = mockData.filter(item => {
    if (benchFilter && item.benchmark !== benchFilter) return false;
    if (periodFilter && item.period !== periodFilter) return false;
    return true;
  });

  const totalComparisons = mockData.length;
  const positiveAlphaCount = mockData.filter(i => i.alpha > 0).length;
  const avgIR = (mockData.reduce((sum, i) => sum + i.informationRatio, 0) / mockData.length).toFixed(2);
  const avgUpCapture = Math.round(mockData.reduce((sum, i) => sum + i.upCapture, 0) / mockData.length);
  const avgDownCapture = Math.round(mockData.reduce((sum, i) => sum + i.downCapture, 0) / mockData.length);

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: (record: BenchmarkComparison) => {
        setSelectedBenchmark(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'export',
      label: '导出对比',
      icon: <ExportOutlined />,
      onClick: (record: BenchmarkComparison) => {
        message.success(`导出 "${record.portfolioName}" vs ${benchMap[record.benchmark]?.label} 对比报告`);
      },
    },
    {
      key: 'switch',
      label: '切换基准',
      icon: <SwapOutlined />,
      onClick: (record: BenchmarkComparison) => {
        message.info(`切换 "${record.portfolioName}" 的对标基准`);
      },
    },
    {
      key: 'target',
      label: '设置目标',
      icon: <FlagOutlined />,
      onClick: (record: BenchmarkComparison) => {
        message.info(`设置 ${record.portfolioName} 的Alpha目标`);
      },
    },
  ];

  const columns = [
    {
      title: '组合名',
      dataIndex: 'portfolioName',
      key: 'portfolioName',
      width: 170,
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '基准',
      dataIndex: 'benchmark',
      key: 'benchmark',
      width: 100,
      render: (bench: string) => (
        <Tag color={benchMap[bench]?.color as any} style={{ fontWeight: 500 }}>
          {benchMap[bench]?.label}
        </Tag>
      ),
    },
    {
      title: '周期',
      dataIndex: 'period',
      key: 'period',
      width: 90,
      render: (p: string) => <Tag>{periodMap[p]}</Tag>,
    },
    {
      title: '组合回报%',
      dataIndex: 'portfolioReturn',
      key: 'portfolioReturn',
      width: 105,
      render: (val: number) => (
        <span className={`font-bold ${val >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {val >= 0 ? '+' : ''}{val.toFixed(1)}%
        </span>
      ),
    },
    {
      title: '基准回报%',
      dataIndex: 'benchmarkReturn',
      key: 'benchmarkReturn',
      width: 105,
      render: (val: number) => (
        <span className={val >= 0 ? 'text-green-600' : 'text-red-600'}>
          {val >= 0 ? '+' : ''}{val.toFixed(1)}%
        </span>
      ),
    },
    {
      title: 'Alpha%',
      dataIndex: 'alpha',
      key: 'alpha',
      width: 80,
      render: (val: number) => (
        <span className={`font-bold ${val > 0 ? 'text-green-600' : val === 0 ? '' : 'text-red-600'}`}>
          {val > 0 ? '+' : ''}{val.toFixed(1)}
        </span>
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
      title: 'TE%',
      dataIndex: 'trackingError',
      key: 'trackingError',
      width: 60,
      render: (val: number) => `${val.toFixed(1)}%`,
    },
    {
      title: 'IR',
      dataIndex: 'informationRatio',
      key: 'informationRatio',
      width: 60,
      render: (val: number) => (
        <span className={val > 0 ? 'text-green-600 font-semibold' : 'text-red-600'}>
          {val.toFixed(2)}
        </span>
      ),
    },
    {
      title: '上行捕获%',
      dataIndex: 'upCapture',
      key: 'upCapture',
      width: 95,
      render: (val: number) => (
        <Progress percent={Math.min(val, 200)} size="small" strokeColor="#16A34A" format={() => `${val}%`} />
      ),
    },
    {
      title: '下行捕获%',
      dataIndex: 'downCapture',
      key: 'downCapture',
      width: 95,
      render: (val: number) => (
        <Progress percent={Math.min(val, 200)} size="small" strokeColor={val < 100 ? '#16A34A' : '#DC2626'} format={() => `${val}%`} />
      ),
    },
    {
      title: '最大回撤%',
      dataIndex: 'maxDrawdown',
      key: 'maxDrawdown',
      width: 100,
      render: (val: number) => (
        <span className={val > -10 ? 'text-green-600' : 'text-red-600'}>{val.toFixed(1)}%</span>
      ),
    },
    {
      title: 'Sharpe',
      dataIndex: 'sharpeRatio',
      key: 'sharpeRatio',
      width: 70,
      render: (val: number) => val.toFixed(2),
    },
    {
      title: 'Sortino',
      dataIndex: 'sortinoRatio',
      key: 'sortinoRatio',
      width: 70,
      render: (val: number) => val.toFixed(2),
    },
    {
      title: 'Calmar',
      dataIndex: 'calmarRatio',
      key: 'calmarRatio',
      width: 70,
      render: (val: number) => val.toFixed(2),
    },
    {
      title: '对比日期',
      dataIndex: 'comparedAt',
      key: 'comparedAt',
      width: 110,
    },
  ];

  const mockHistory = [
    { id: 1, date: '2024-05-23', portfolioRet: 78.5, benchRet: 112.3, alpha: -33.8 },
    { id: 2, date: '2024-04-23', portfolioRet: 62.1, benchRet: 89.5, alpha: -27.4 },
    { id: 3, date: '2024-03-23', portfolioRet: 45.8, benchRet: 68.2, alpha: -22.4 },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <AimOutlined className="text-3xl" style={{ color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0">基准对标分析</h1>
            <p className="text-gray-500 text-sm mt-1">
              多基准绩效比较系统 · BTC/ETH/SP500/NASDAQ/GOLD交叉对比 · AIOPC基准选择器
            </p>
          </div>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="对标组合数"
              value={totalComparisons}
              suffix="对"
              icon={<DashboardOutlined />}
              color="#1677FF"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="正Alpha占比"
              value={`${Math.round(positiveAlphaCount / totalComparisons * 100)}`}
              suffix="%"
              icon={<TrophyOutlined />}
              color={positiveAlphaCount / totalComparisons > 0.5 ? '#16A34A' : '#F59E0B'}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="平均IR"
              value={avgIR}
              suffix=""
              icon={<RiseOutlined />}
              color={parseFloat(avgIR) > 0 ? '#16A34A' : '#DC2626'}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="上行/下行捕获"
              value={`${avgUpCapture}/${avgDownCapture}`}
              suffix="%"
              icon={<FallOutlined />}
              color="#7C3AED"
            />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap size="middle">
            <Select
              placeholder="基准选择"
              allowClear
              style={{ width: 130 }}
              value={benchFilter || undefined}
              onChange={setBenchFilter}
            >
              {Object.entries(benchMap).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
            <Select
              placeholder="时间周期"
              allowClear
              style={{ width: 120 }}
              value={periodFilter || undefined}
              onChange={setPeriodFilter}
            >
              {Object.entries(periodMap).map(([key, label]) => (
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
          title={`${selectedBenchmark?.portfolioName || ''} vs ${benchMap[selectedBenchmark?.benchmark || '']?.label || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={900}
        >
          {selectedBenchmark && (
            <div className="space-y-6">
              {/* 对标概览 */}
              <Descriptions title="对标概览" bordered column={2} size="small">
                <Descriptions.Item label="组合名称">{selectedBenchmark.portfolioName}</Descriptions.Item>
                <Descriptions.Item label="对标基准">
                  <Tag color={benchMap[selectedBenchmark.benchmark]?.color as any}>
                    {benchMap[selectedBenchmark.benchmark]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="统计周期">{periodMap[selectedBenchmark.period]}</Descriptions.Item>
                <Descriptions.Item label="对比日期">{selectedBenchmark.comparedAt}</Descriptions.Item>
                <Descriptions.Item label="组合回报">
                  <span className={`text-lg font-bold ${selectedBenchmark.portfolioReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedBenchmark.portfolioReturn >= 0 ? '+' : ''}{selectedBenchmark.portfolioReturn.toFixed(2)}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="基准回报">
                  <span className={selectedBenchmark.benchmarkReturn >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {selectedBenchmark.benchmarkReturn >= 0 ? '+' : ''}{selectedBenchmark.benchmarkReturn.toFixed(2)}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Alpha">
                  <span className={`text-xl font-bold ${selectedBenchmark.alpha > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedBenchmark.alpha > 0 ? '+' : ''}{selectedBenchmark.alpha.toFixed(2)}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="Beta">{selectedBenchmark.beta.toFixed(2)}</Descriptions.Item>
              </Descriptions>

              {/* 收益对比表 */}
              <Card title="多周期收益对比" size="small">
                <Table
                  dataSource={[
                    { period: '1M', portfolio: '+5.2%', benchmark: '+8.5%', alpha: '-3.3%' },
                    { period: '3M', portfolio: '+18.5%', benchmark: '+25.2%', alpha: '-6.7%' },
                    { period: '6M', portfolio: '+32.5%', benchmark: '+45.8%', alpha: '-13.3%' },
                    { period: '1Y', portfolio: '+85.2%', benchmark: '+125.5%', alpha: '-40.3%' },
                    { period: 'YTD', portfolio: '+42.8%', benchmark: '+58.2%', alpha: '-15.4%' },
                  ]}
                  rowKey="period"
                  size="small"
                  pagination={false}
                  columns={[
                    { title: '周期', dataIndex: 'period' },
                    { title: '组合', dataIndex: 'portfolio', render: (t: string) => <span className="text-green-600">{t}</span> },
                    { title: '基准', dataIndex: 'benchmark', render: (t: string) => <span className="text-blue-600">{t}</span> },
                    { title: 'Alpha', dataIndex: 'alpha', render: (t: string) => <span className={`font-bold ${t.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>{t}</span> },
                  ]}
                />
              </Card>

              {/* 风险调整指标 */}
              <Descriptions title="风险调整后指标" bordered column={3} size="small">
                <Descriptions.Item label="Sharpe">{selectedBenchmark.sharpeRatio.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="Sortino">{selectedBenchmark.sortinoRatio.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="Calmar">{selectedBenchmark.calmarRatio.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="跟踪误差">{selectedBenchmark.trackingError.toFixed(1)}%</Descriptions.Item>
                <Descriptions.Item label="信息比率">
                  <span className={selectedBenchmark.informationRatio > 0 ? 'text-green-600 font-semibold' : 'text-red-600'}>
                    {selectedBenchmark.informationRatio.toFixed(2)}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="最大回撤">{selectedBenchmark.maxDrawdown.toFixed(1)}%</Descriptions.Item>
                <Descriptions.Item label="上行捕获率">{selectedBenchmark.upCapture}%</Descriptions.Item>
                <Descriptions.Item label="下行捕获率">{selectedBenchmark.downCapture}%</Descriptions.Item>
                <Descriptions.Item label="Beta">{selectedBenchmark.beta.toFixed(2)}</Descriptions.Item>
              </Descriptions>

              {/* AIOPC基准适配度 */}
              <Card
                title={
                  <span>
                    <ThunderboltOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                    AIOPC基准适配度评估
                  </span>
                }
                size="small"
                style={{ borderColor: '#F0B90B' }}
              >
                <Row gutter={[16, 12]}>
                  {[
                    { label: '市场契合度', score: selectedBenchmark.beta < 1 ? 75 : 60, color: '#1677FF' },
                    { label: '风格漂移', score: selectedBenchmark.trackingError < 15 ? 88 : 65, color: '#16A34A' },
                    { label: '风险暴露', score: Math.max(40, 100 - Math.abs(selectedBenchmark.beta - 1) * 40), color: '#F59E0B' },
                    { label: '收益贡献', score: Math.max(30, 60 + selectedBenchmark.alpha), color: '#7C3AED' },
                    { label: '成本效率', score: selectedBenchmark.informationRatio > 0 ? 82 : 55, color: '#EC4899' },
                  ].map(item => (
                    <Col xs={24} sm={12} md={8} lg={4} key={item.label}>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                        <Progress
                          percent={item.score}
                          strokeColor={item.color}
                          format={(percent) => <span style={{ color: item.color }}>{percent}</span>}
                          size={48}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>

              {/* 历史对标记录 */}
              <Table
                dataSource={mockHistory}
                rowKey="id"
                size="small"
                pagination={false}
                title={() => <span>历史对标记录</span>}
                columns={[
                  { title: '日期', dataIndex: 'date', width: 110 },
                  { title: '组合回报%', dataIndex: 'portfolioRet', render: (v: number) => `+${v}%` },
                  { title: '基准回报%', dataIndex: 'benchRet', render: (v: number) => `+${v}%` },
                  { title: 'Alpha%', dataIndex: 'alpha', render: (v: number) => <span className={v > 0 ? 'text-green-600' : 'text-red-600'}>{v > 0 ? '+' : ''}{v}%</span> },
                ]}
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
