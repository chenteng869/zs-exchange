'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import {
  Button,
  Space,
  Tag,
  Modal,
  message,
  Select,
  Table,
  Card,
  Progress,
  Tooltip,
  Divider,
  Descriptions,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  ExportOutlined,
  BellOutlined,
  BarChartOutlined,
  DollarOutlined,
  RiseOutlined,
  FallOutlined,
  ThunderboltOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

const { Option } = Select;

interface DistributionMetric {
  id: string;
  metricName: string;
  dimension: string;
  value: number;
  previousValue: number;
  changePercent: number;
  unit: string;
  dataPoints: number;
  trend: 'stable' | 'up' | 'down' | 'volatile';
  insight: string;
  generatedAt: string;
}

const mockMetrics: DistributionMetric[] = [
  {
    id: '1',
    metricName: 'region_performance',
    dimension: '亚太地区',
    value: 2850000,
    previousValue: 2420000,
    changePercent: 17.8,
    unit: 'USD',
    dataPoints: 156,
    trend: 'up',
    insight: '亚太市场增长强劲，主要受新加坡和韩国推动',
    generatedAt: '2024-06-23T08:00:00Z',
  },
  {
    id: '2',
    metricName: 'product_channel',
    dimension: 'Alpha动量信号V3',
    value: 1256000,
    previousValue: 980000,
    changePercent: 28.2,
    unit: 'USD',
    dataPoints: 89,
    trend: 'up',
    insight: '该产品在专业投资者群体中受欢迎度持续上升',
    generatedAt: '2024-06-23T07:30:00Z',
  },
  {
    id: '3',
    metricName: 'time_series',
    dimension: '月度收入趋势',
    value: 4520000,
    previousValue: 4180000,
    changePercent: 8.1,
    unit: 'USD',
    dataPoints: 12,
    trend: 'stable',
    insight: '月度收入保持稳定增长态势，符合预期目标',
    generatedAt: '2024-06-23T09:00:00Z',
  },
  {
    id: '4',
    metricName: 'cohort_analysis',
    dimension: 'Q1新用户留存率',
    value: 68.5,
    previousValue: 62.3,
    changePercent: 10.0,
    unit: '%',
    dataPoints: 2450,
    trend: 'up',
    insight: '新用户留存改善显著，产品粘性提升',
    generatedAt: '2024-06-22T16:00:00Z',
  },
  {
    id: '5',
    metricName: 'region_performance',
    dimension: '欧洲市场',
    value: 1680000,
    previousValue: 1850000,
    changePercent: -9.2,
    unit: 'USD',
    dataPoints: 98,
    trend: 'down',
    insight: '欧洲市场下滑，需关注合规政策变化影响',
    generatedAt: '2024-06-22T14:00:00Z',
  },
  {
    id: '6',
    metricName: 'product_channel',
    dimension: '量化套利基金Pro',
    value: 2100000,
    previousValue: 1950000,
    changePercent: 7.7,
    unit: 'USD',
    dataPoints: 67,
    trend: 'stable',
    insight: '机构客户贡献稳定，大额入金增加',
    generatedAt: '2024-06-22T11:00:00Z',
  },
  {
    id: '7',
    metricName: 'time_series',
    dimension: '日均活跃用户',
    value: 12580,
    previousValue: 11200,
    changePercent: 12.3,
    unit: '人',
    dataPoints: 30,
    trend: 'up',
    insight: 'DAU创历史新高，移动端占比达65%',
    generatedAt: '2024-06-23T06:00:00Z',
  },
  {
    id: '8',
    metricName: 'cohort_analysis',
    dimension: '付费转化周期',
    value: 4.2,
    previousValue: 5.8,
    changePercent: -27.6,
    unit: '天',
    dataPoints: 1890,
    trend: 'up',
    insight: '付费转化速度加快，试用到付费路径优化见效',
    generatedAt: '2024-06-21T18:00:00Z',
  },
  {
    id: '9',
    metricName: 'region_performance',
    dimension: '北美市场',
    value: 3200000,
    previousValue: 2980000,
    changePercent: 7.4,
    unit: 'USD',
    dataPoints: 134,
    trend: 'stable',
    insight: '美国市场稳健增长，加拿大区域表现突出',
    generatedAt: '2024-06-21T15:00:00Z',
  },
  {
    id: '10',
    metricName: 'product_channel',
    dimension: 'DeFi收益聚合器',
    value: 392000,
    previousValue: 280000,
    changePercent: 40.0,
    unit: 'USD',
    dataPoints: 45,
    trend: 'volatile',
    insight: '新产品增长迅猛但波动较大，需密切监控风险',
    generatedAt: '2024-06-20T20:00:00Z',
  },
  {
    id: '11',
    metricName: 'time_series',
    dimension: '渠道ROI',
    value: 285,
    previousValue: 242,
    changePercent: 17.8,
    unit: '%',
    dataPoints: 8,
    trend: 'up',
    insight: '整体营销ROI提升，KOL渠道效果最佳',
    generatedAt: '2024-06-20T12:00:00Z',
  },
  {
    id: '12',
    metricName: 'cohort_analysis',
    dimension: '用户生命周期价值',
    value: 3850,
    previousValue: 3280,
    changePercent: 17.4,
    unit: 'USD',
    dataPoints: 5670,
    trend: 'up',
    insight: 'LTV持续提升，高价值用户群体扩大',
    generatedAt: '2024-06-19T22:00:00Z',
  },
];

const metricConfig: Record<string, { label: string; color: string }> = {
  region_performance: { label: '区域绩效', color: '#1677FF' },
  product_channel: { label: '产品渠道', color: '#16A34A' },
  time_series: { label: '时间序列', color: '#7C3AED' },
  cohort_analysis: { label: '队列分析', color: '#F59E0B' },
};

const trendConfig: Record<string, { label: string; color: string; icon: string }> = {
  stable: { label: '平稳', color: 'default', icon: '━' },
  up: { label: '上升', color: 'success', icon: '↑' },
  down: { label: '下降', color: 'error', icon: '↓' },
  volatile: { label: '波动', color: 'warning', icon: '〰' },
};

export default function DistributionAnalyticsPage() {
  const [selectedMetric, setSelectedMetric] = useState<DistributionMetric | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterMetricType, setFilterMetricType] = useState<string>('');
  const [filterDimension, setFilterDimension] = useState<string>('');
  const [filterTimeRange, setFilterTimeRange] = useState<string>('');

  const filteredMetrics = mockMetrics.filter((metric) => {
    if (filterMetricType && metric.metricName !== filterMetricType) return false;
    if (filterDimension && !metric.dimension.includes(filterDimension)) return false;
    return true;
  });

  const monthlyRevenue = mockMetrics
    .filter((m) => m.metricName === 'time_series' && m.dimension === '月度收入趋势')
    .reduce((sum, m) => sum + m.value, 0);
  const avgGrowth = (
    mockMetrics.reduce((sum, m) => sum + Math.abs(m.changePercent), 0) / mockMetrics.length
  ).toFixed(1);
  const topRegion = mockMetrics.find(
    (m) => m.metricName === 'region_performance'
  )?.dimension || '-';
  const channelRoi = mockMetrics.find(
    (m) => m.dimension === '渠道ROI'
  )?.value || 0;
  const aiopcInsights = mockMetrics.filter((m) => m.insight).length;

  const columns = [
    {
      title: '指标名称',
      dataIndex: 'metricName',
      key: 'metricName',
      render: (name: string) => (
        <Tag color={metricConfig[name]?.color}>{metricConfig[name]?.label}</Tag>
      ),
    },
    {
      title: '维度',
      dataIndex: 'dimension',
      key: 'dimension',
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '当前值',
      dataIndex: 'value',
      key: 'value',
      render: (val: number, record: DistributionMetric) =>
        record.unit === '%' ? `${val}%` : `$${val.toLocaleString()}`,
    },
    {
      title: '上期值',
      dataIndex: 'previousValue',
      key: 'previousValue',
      render: (val: number, record: DistributionMetric) =>
        record.unit === '%' ? `${val}%` : `$${val.toLocaleString()}`,
    },
    {
      title: '变化%',
      dataIndex: 'changePercent',
      key: 'changePercent',
      render: (val: number) => (
        <span style={{ color: val >= 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
          {val >= 0 ? '+' : ''}
          {val.toFixed(1)}%
        </span>
      ),
    },
    { title: '单位', dataIndex: 'unit', key: 'unit' },
    {
      title: '趋势',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => (
        <Tag color={trendConfig[trend]?.color}>
          {trendConfig[trend]?.icon} {trendConfig[trend]?.label}
        </Tag>
      ),
    },
    {
      title: '数据点数',
      dataIndex: 'dataPoints',
      key: 'dataPoints',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: 'AI洞察摘要',
      dataIndex: 'insight',
      key: 'insight',
      width: 250,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span className="text-xs text-gray-600">{text}</span>
        </Tooltip>
      ),
    },
    {
      title: '生成时间',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      render: (val: string) => dayjs(val).format('MM-DD HH:mm'),
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      onClick: (record: DistributionMetric) => {
        setSelectedMetric(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'export',
      label: '导出',
      icon: <ExportOutlined />,
      onClick: (record: DistributionMetric) => {
        message.success(`已导出: ${record.dimension}`);
      },
    },
    {
      key: 'alert',
      label: '设置警报',
      icon: <BellOutlined />,
      onClick: (record: DistributionMetric) => {
        message.info(`设置警报: ${record.dimension}`);
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold m-0 flex items-center gap-3">
              <BarChartOutlined style={{ color: '#F0B90B' }} />
              分销数据分析
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              多维度分销绩效报表 · 区域/产品/渠道/时间交叉分析 · AIOPC洞察引擎
            </p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => message.success('数据已刷新')}>
              刷新
            </Button>
            <Button type="primary" icon={<ThunderboltOutlined />}>
              AIOPC深度分析
            </Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard
            title="本月总收入"
            value={`${(monthlyRevenue / 1000000).toFixed(1)}M`}
            prefix="$"
            icon={<DollarOutlined />}
            color="#1677FF"
            description="全渠道汇总"
          />
          <DataCard
            title="同比增长"
            value={`${avgGrowth}%`}
            prefix="+"
            icon={<RiseOutlined />}
            color="#16A34A"
            description="平均增长率"
          />
          <DataCard
            title="Top区域贡献"
            value={topRegion}
            icon={<LineChartOutlined />}
            color="#7C3AED"
            description="最高营收区域"
          />
          <DataCard
            title="渠道ROI"
            value={`${channelRoi}%`}
            icon={<BarChartOutlined />}
            color="#F59E0B"
            description="营销投入产出比"
          />
          <DataCard
            title="AIOPC洞察数"
            value={aiopcInsights}
            icon={<ThunderboltOutlined />}
            color="#F0B90B"
            description="智能分析报告"
          />
        </div>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap>
            <Select
              placeholder="指标类型"
              style={{ width: 150 }}
              allowClear
              value={filterMetricType || undefined}
              onChange={setFilterMetricType}
            >
              <Option value="region_performance">区域绩效</Option>
              <Option value="product_channel">产品渠道</Option>
              <Option value="time_series">时间序列</Option>
              <Option value="cohort_analysis">队列分析</Option>
            </Select>
            <Select
              placeholder="维度筛选"
              style={{ width: 160 }}
              allowClear
              value={filterDimension || undefined}
              onChange={setFilterDimension}
            >
              <Option value="亚太">亚太地区</Option>
              <Option value="欧洲">欧洲市场</Option>
              <Option value="北美">北美市场</Option>
              <Option value="月度">月度数据</Option>
              <Option value="用户">用户相关</Option>
            </Select>
            <Select
              placeholder="时间范围"
              style={{ width: 140 }}
              allowClear
              value={filterTimeRange || undefined}
              onChange={setFilterTimeRange}
            >
              <Option value="week">本周</Option>
              <Option value="month">本月</Option>
              <Option value="quarter">本季度</Option>
              <Option value="year">本年度</Option>
            </Select>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable
          columns={columns as any}
          dataSource={filteredMetrics as any}
          rowKey="id"
          actions={actions}
          showSearch={false}
          showAdd={false}
        />

        {/* 详情弹窗 */}
        <Modal
          title={
            <span>
              指标详情 - <span style={{ color: '#F0B90B' }}>{selectedMetric?.dimension}</span>
            </span>
          }
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>
              关闭
            </Button>,
            <Button key="ai" type="primary" icon={<ThunderboltOutlined />}>
              AIOPC深度分析
            </Button>,
          ]}
          width={850}
        >
          {selectedMetric && (
            <div className="space-y-6">
              {/* 指标概览 */}
              <Divider orientation="left">指标概览</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="指标类型">
                  <Tag color={metricConfig[selectedMetric.metricName]?.color}>
                    {metricConfig[selectedMetric.metricName]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="分析维度">{selectedMetric.dimension}</Descriptions.Item>
                <Descriptions.Item label="当前值">
                  <span className="text-xl font-bold">
                    {selectedMetric.unit === '%'
                      ? `${selectedMetric.value}%`
                      : `$${selectedMetric.value.toLocaleString()}`}
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="上期值">
                  {selectedMetric.unit === '%'
                    ? `${selectedMetric.previousValue}%`
                    : `$${selectedMetric.previousValue.toLocaleString()}`}
                </Descriptions.Item>
                <Descriptions.Item label="变化幅度">
                  <span
                    style={{
                      color: selectedMetric.changePercent >= 0 ? '#16A34A' : '#DC2626',
                      fontWeight: 700,
                      fontSize: 18,
                    }}
                  >
                    {selectedMetric.changePercent >= 0 ? '+' : ''}
                    {selectedMetric.changePercent.toFixed(1)}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="趋势判断">
                  <Tag color={trendConfig[selectedMetric.trend]?.color}>
                    {trendConfig[selectedMetric.trend]?.icon} {trendConfig[selectedMetric.trend]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="数据点数量">{selectedMetric.dataPoints.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="生成时间">
                  {dayjs(selectedMetric.generatedAt).format('YYYY-MM-DD HH:mm:ss')}
                </Descriptions.Item>
              </Descriptions>

              {/* 趋势图表描述 */}
              <Divider orientation="left">趋势图表描述</Divider>
              <Card size="small">
                <Space direction="vertical" className="w-full" size="middle">
                  <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
                    <LineChartOutlined style={{ color: '#1677FF', fontSize: 20 }} />
                    <div>
                      <div className="font-semibold text-blue-800">近30日趋势</div>
                      <p className="text-sm text-gray-600 mt-1">
                        指标呈现{selectedMetric.trend === 'up' ? '稳步上升' : selectedMetric.trend === 'down' ? '缓慢下降' : '平稳波动'}态势，
                        近期{selectedMetric.changePercent >= 0 ? '表现良好' : '需关注'}。
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-3 bg-green-50 rounded-lg">
                      <div className="text-xs text-gray-500">最高值</div>
                      <div className="text-lg font-bold text-green-600">
                        {(selectedMetric.value * 1.15).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-orange-50 rounded-lg">
                      <div className="text-xs text-gray-500">平均值</div>
                      <div className="text-lg font-bold text-orange-600">
                        {Math.round(selectedMetric.value * 0.95).toLocaleString()}
                      </div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                      <div className="text-xs text-gray-500">最低值</div>
                      <div className="text-lg font-bold text-red-600">
                        {Math.round(selectedMetric.value * 0.78).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </Space>
              </Card>

              {/* AIOPC深度分析 */}
              <Divider orientation="left">
                <ThunderboltOutlined style={{ color: '#F0B90B' }} /> AIOPC深度分析
              </Divider>
              <Card
                style={{
                  background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFDF5 100%)',
                  borderColor: '#F0B90B',
                }}
                size="small"
              >
                <div className="space-y-4">
                  <div className="flex gap-3 p-3 bg-white rounded-lg">
                    <ThunderboltOutlined style={{ color: '#F0B90B', fontSize: 20 }} />
                    <div>
                      <div className="font-semibold mb-1">AI智能洞察</div>
                      <p className="text-sm text-gray-700">{selectedMetric.insight}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-white rounded-lg">
                      <div className="text-sm font-semibold mb-2 text-purple-600">关键发现</div>
                      <ul className="text-xs text-gray-600 space-y-1 ml-4">
                        <li>• 该指标{selectedMetric.changePercent > 10 ? '显著优于' : '基本持平于'}行业平均水平</li>
                        <li>• 预测下期变化：{selectedMetric.changePercent > 0 ? '+5%~+12%' : '-3%~-8%'}</li>
                        <li>• 影响因子：市场环境(40%) + 产品迭代(35%) + 营销活动(25%)</li>
                      </ul>
                    </div>
                    <div className="p-3 bg-white rounded-lg">
                      <div className="text-sm font-semibold mb-2 text-blue-600">行动建议</div>
                      <ul className="text-xs text-gray-600 space-y-1 ml-4">
                        <li>• {selectedMetric.changePercent > 0 ? '保持现有策略，加大投入' : '立即启动整改计划'}</li>
                        <li>• 建议关注关联指标：用户满意度、NPS评分</li>
                        <li>• 下次评估周期：7个工作日后</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </Card>

              {/* 相关指标关联 */}
              <Divider orientation="left">相关指标关联</Divider>
              <Table
                size="small"
                pagination={false}
                dataSource={[
                  { name: '用户活跃度', correlation: '强正相关', score: 0.87, action: '查看详情' },
                  { name: '转化漏斗效率', correlation: '中等相关', score: 0.65, action: '查看详情' },
                  { name: '客户满意度(NPS)', correlation: '弱相关', score: 0.32, action: '查看详情' },
                  { name: '市场份额', correlation: '强正相关', score: 0.79, action: '查看详情' },
                ]}
                columns={[
                  { title: '关联指标', dataIndex: 'name', key: 'name' },
                  {
                    title: '相关性',
                    dataIndex: 'correlation',
                    key: 'correlation',
                    render: (val: string) => (
                      <Tag color={val.includes('强') ? 'green' : val.includes('中') ? 'orange' : 'default'}>
                        {val}
                      </Tag>
                    ),
                  },
                  {
                    title: '相关系数',
                    dataIndex: 'score',
                    key: 'score',
                    render: (val: number) => (
                      <Progress percent={Math.round(val * 100)} size="small" style={{ width: 80 }} />
                    ),
                  },
                  { title: '操作', dataIndex: 'action', key: 'action' },
                ]}
                rowKey="name"
              />

              {/* 历史快照 */}
              <Divider orientation="left">历史快照记录</Divider>
              <Table
                size="small"
                pagination={false}
                dataSource={[
                  { date: '2024-06-23', value: selectedMetric.value, change: selectedMetric.changePercent, snapshotId: 'SNAP-001' },
                  { date: '2024-06-16', value: Math.round(selectedMetric.value / 1.05), change: 5.2, snapshotId: 'SNAP-002' },
                  { date: '2024-06-09', value: Math.round(selectedMetric.value / 1.08), change: -2.1, snapshotId: 'SNAP-003' },
                  { date: '2024-06-02', value: Math.round(selectedMetric.value / 1.03), change: 3.4, snapshotId: 'SNAP-004' },
                ]}
                columns={[
                  { title: '快照日期', dataIndex: 'date', key: 'date' },
                  { title: '快照值', dataIndex: 'value', key: 'value', render: (v: number) => v.toLocaleString() },
                  {
                    title: '当周变化',
                    dataIndex: 'change',
                    key: 'change',
                    render: (v: number) => (
                      <span style={{ color: v >= 0 ? '#16A34A' : '#DC2626' }}>
                        {v >= 0 ? '+' : ''}{v}%
                      </span>
                    ),
                  },
                  { title: '快照ID', dataIndex: 'snapshotId', key: 'snapshotId', render: (v: string) => <code className="text-xs">{v}</code> },
                ]}
                rowKey="snapshotId"
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
