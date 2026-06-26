'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Button,
  Space,
  Tag,
  Card,
  Select,
  DatePicker,
  Row,
  Col,
  Statistic,
  Alert,
  Table,
  Tabs,
  Tooltip,
  Badge,
  Switch,
  InputNumber,
} from 'antd';
import {
  LineChartOutlined,
  BarChartOutlined,
  ReloadOutlined,
  SettingOutlined,
  RiseOutlined,
  WarningOutlined,
  ClockCircleOutlined,
  AreaChartOutlined,
  DotChartOutlined,
  ThunderboltOutlined,
  EyeOutlined,
  FilterOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import AdminLayout from '@/components/admin/AdminLayout';
import SafeECharts from '@/components/admin/SafeECharts';

// 模拟时序数据 - 日交易量
const mockDailyVolume = Array.from({ length: 90 }, (_, i) => {
  const date = dayjs('2024-03-10').add(i, 'day');
  const base = 140000 + Math.sin(i * 0.15) * 20000 + (i % 7 < 5 ? 10000 : -15000);
  const noise = (Math.random() - 0.5) * 15000;
  // 注入几个异常点
  const isAnomaly = [12, 35, 58, 72].includes(i);
  const anomalyValue = isAnomaly ? base + noise + (Math.random() > 0.5 ? 50000 : -40000) : 0;
  return {
    date: date.format('MM-DD'),
    fullDate: date.format('YYYY-MM-DD'),
    value: Math.round(base + noise + anomalyValue),
    isAnomaly,
    weekday: date.day(),
    trend: i > 0 ? (Math.random() > 0.6 ? 'up' : Math.random() > 0.4 ? 'down' : 'stable') : 'stable',
  };
});

// STL分解模拟数据
const generateSTLData = () => {
  return mockDailyVolume.map((d, i) => ({
    date: d.date,
    original: d.value,
    trend: Math.round(145000 + i * 300 + Math.sin(i * 0.08) * 8000),
    seasonal: Math.round(Math.sin(i * 0.89) * 18000 + (i % 7 < 5 ? 8000 : -12000)),
    residual: Math.round(d.value - (145000 + i * 300 + Math.sin(i * 0.08) * 8000) - (Math.sin(i * 0.89) * 18000 + (i % 7 < 5 ? 8000 : -12000))),
  }));
};

const stlData = generateSTLData();

// 预测外推数据
const forecastData = [
  { date: '06-09', lower: 138000, predicted: 152000, upper: 166000 },
  { date: '06-10', lower: 135000, predicted: 155000, upper: 175000 },
  { date: '06-11', lower: 132000, predicted: 148000, upper: 164000 },
  { date: '06-12', lower: 130000, predicted: 158000, upper: 186000 },
  { date: '06-13', lower: 128000, predicted: 153000, upper: 178000 },
  { date: '06-14', lower: 125000, predicted: 149000, upper: 173000 },
  { date: '06-15', lower: 122000, predicted: 156000, upper: 190000 },
];

// 原始趋势图配置
const trendOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['交易量'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
  xAxis: {
    type: 'category',
    data: mockDailyVolume.slice(-30).map(d => d.date),
    axisLabel: { rotate: 30, fontSize: 10 },
  },
  yAxis: { type: 'value', name: '交易量', axisLabel: { formatter: (v: number) => `${(v / 1000).toFixed(0)}K` } },
  series: [{
    name: '交易量',
    type: 'line',
    data: mockDailyVolume.slice(-30).map(d => ({
      value: d.value,
      itemStyle: d.isAnomaly ? { color: '#DC2626' } : undefined,
    })),
    smooth: true,
    areaStyle: { opacity: 0.1 },
    markPoint: {
      data: mockDailyVolume.slice(-30)
        .filter(d => d.isAnomaly)
        .map((d, idx) => ({
          name: '异常',
          coord: [d.date, d.value],
          value: d.value,
          symbolSize: 50,
          itemStyle: { color: '#DC2626' },
          label: { show: true, formatter: '异常', position: 'top' },
        })),
    },
  }],
};

// STL分解图配置
const stlDecompositionOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['原始数据', '趋势项', '季节项', '残差项'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '12%', top: '10%', containLabel: true },
  xAxis: {
    type: 'category',
    data: stlData.slice(-30).map(d => d.date),
    axisLabel: { rotate: 30, fontSize: 10 },
  },
  yAxis: { type: 'value' },
  series: [
    { name: '原始数据', type: 'line', data: stlData.slice(-30).map(d => d.original), lineStyle: { width: 2 }, itemStyle: { color: '#1677FF' } },
    { name: '趋势项', type: 'line', data: stlData.slice(-30).map(d => d.trend), lineStyle: { width: 2, type: 'dashed' }, itemStyle: { color: '#16A34A' } },
    { name: '季节项', type: 'line', data: stlData.slice(-30).map(d => d.seasonal), lineStyle: { width: 2, type: 'dotted' }, itemStyle: { color: '#F59E0B' } },
    { name: '残差项', type: 'line', data: stlData.slice(-30).map(d => d.residual), lineStyle: { width: 1 }, itemStyle: { color: '#DC2626' } },
  ],
};

// 预测外推图配置
const forecastOption = {
  tooltip: { trigger: 'axis' },
  legend: { data: ['历史值', '预测值', '置信上限', '置信下限'], bottom: 0 },
  grid: { left: '3%', right: '4%', bottom: '12%', containLabel: true },
  xAxis: {
    type: 'category',
    data: [...mockDailyVolume.slice(-14).map(d => d.date), ...forecastData.map(d => d.date)],
    axisLabel: { rotate: 30, fontSize: 10 },
  },
  yAxis: { type: 'value', name: '交易量', axisLabel: { formatter: (v: number) => `${(v / 1000).toFixed(0)}K` } },
  series: [
    {
      name: '历史值',
      type: 'line',
      data: mockDailyVolume.slice(-14).map(d => d.value),
      smooth: true,
      itemStyle: { color: '#1677FF' },
    },
    {
      name: '预测值',
      type: 'line',
      data: [...Array(14).fill(null), ...forecastData.map(d => d.predicted)],
      smooth: true,
      lineStyle: { width: 2, type: 'dashed' },
      itemStyle: { color: '#7C3AED' },
    },
    {
      name: '置信上限',
      type: 'line',
      data: [...Array(14).fill(null), ...forecastData.map(d => d.upper)],
      lineStyle: { width: 1, type: 'dotted', opacity: 0.5 },
      itemStyle: { color: '#7C3AED' },
      areaStyle: { opacity: 0.05 },
      showSymbol: false,
    },
    {
      name: '置信下限',
      type: 'line',
      data: [...Array(14).fill(null), ...forecastData.map(d => d.lower)],
      lineStyle: { width: 1, type: 'dotted', opacity: 0.5 },
      itemStyle: { color: '#7C3AED' },
      areaStyle: { opacity: 0.05 },
      showSymbol: false,
    },
  ],
};

export default function TimeSeriesPage() {
  const [selectedMetric, setSelectedMetric] = useState('daily_volume');
  const [timeRange, setTimeRange] = useState('30d');
  const [granularity, setGranularity] = useState('daily');
  const [showAnomalies, setShowAnomalies] = useState(true);
  const [activeTab, setActiveTab] = useState('trend');

  // 获取时序数据
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['analytics-timeseries', selectedMetric, timeRange, granularity],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 400));
      return mockDailyVolume;
    },
  });

  // 异常点列表
  const anomalies = mockDailyVolume.filter(d => d.isAnomaly);

  // 统计指标
  const latestValues = data?.slice(-7) || [];
  const avgValue = data ? Math.round(data.reduce((s, d) => s + d.value, 0) / data.length) : 0;
  const maxValue = data ? Math.max(...data.map(d => d.value)) : 0;
  const minValue = data ? Math.min(...data.map(d => d.value)) : 0;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <LineChartOutlined className="text-2xl text-cyan-600" />
          <h1 className="text-2xl font-bold m-0">时序分析</h1>
        </div>

        {/* 控制面板 */}
        <Card className="shadow-sm">
          <Row gutter={[24, 16]} align="middle">
            <Col xs={24} sm={12} md={6}>
              <label className="block text-sm text-gray-500 mb-1">分析指标</label>
              <Select
                value={selectedMetric}
                onChange={setSelectedMetric}
                className="w-full"
                options={[
                  { label: '日交易量', value: 'daily_volume' },
                  { label: '活跃用户数', value: 'active_users' },
                  { label: '新增注册', value: 'new_registrations' },
                  { label: 'NFT交易额', value: 'nft_volume' },
                  { label: '质押TVL', value: 'tvl_staking' },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <label className="block text-sm text-gray-500 mb-1">时间范围</label>
              <Select
                value={timeRange}
                onChange={setTimeRange}
                className="w-full"
                options={[
                  { label: '近7天', value: '7d' },
                  { label: '近30天', value: '30d' },
                  { label: '近90天', value: '90d' },
                  { label: '近半年', value: '180d' },
                  { label: '近一年', value: '365d' },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <label className="block text-sm text-gray-500 mb-1">数据粒度</label>
              <Select
                value={granularity}
                onChange={setGranularity}
                className="w-full"
                options={[
                  { label: '按小时', value: 'hourly' },
                  { label: '按天', value: 'daily' },
                  { label: '按周', value: 'weekly' },
                  { label: '按月', value: 'monthly' },
                ]}
              />
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="flex items-center justify-between h-full pt-5">
                <Space>
                  <Switch
                    checked={showAnomalies}
                    onChange={setShowAnomalies}
                    checkedChildren="显示异常"
                    unCheckedChildren="隐藏异常"
                    size="default"
                  />
                  <Button icon={<ReloadOutlined />} onClick={() => refetch()}>
                    刷新
                  </Button>
                </Space>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 统计概览 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm">
              <Statistic title="当前值" value={latestValues[latestValues.length - 1]?.value || 0} prefix={<RiseOutlined />} valueStyle={{ color: '#1677FF' }} />
              <div className="text-xs text-gray-400 mt-1">最近一个周期</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm">
              <Statistic title="平均值" value={avgValue} valueStyle={{ color: '#16A34A' }} />
              <div className="text-xs text-gray-400 mt-1">全时段均值</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm">
              <Statistic title="最大值" value={maxValue} valueStyle={{ color: '#F59E0B' }} />
              <div className="text-xs text-gray-400 mt-1">峰值</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card className="shadow-sm">
              <Statistic title="检测到异常" value={anomalies.length} suffix="个" valueStyle={{ color: '#DC2626' }} prefix={<WarningOutlined />} />
              <div className="text-xs text-gray-400 mt-1">当前范围内</div>
            </Card>
          </Col>
        </Row>

        {/* 图表区域 */}
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'trend',
              label: (
                <span><AreaChartOutlined /> 趋势分析</span>
              ),
              children: (
                <Card title="时序趋势图" className="shadow-sm" extra={<Tag color="blue">{selectedMetric === 'daily_volume' ? '日交易量' : selectedMetric}</Tag>}>
                  <SafeECharts option={trendOption} style={{ height: 420 }} title="时序趋势" />

                  {showAnomalies && anomalies.length > 0 && (
                    <Alert
                      type="warning"
                      showIcon
                      icon={<WarningOutlined />}
                      message={`检测到 ${anomalies.length} 个异常数据点`}
                      description={
                        <Table
                          dataSource={anomalies}
                          size="small"
                          pagination={false}
                          columns={[
                            { title: '日期', dataIndex: 'fullDate', key: 'date' },
                            { title: '数值', dataIndex: 'value', key: 'val', render: (v: number) => v.toLocaleString() },
                            {
                              title: '偏离度',
                              key: 'deviation',
                              render: (_: any, r: any) => {
                                const dev = ((r.value - avgValue) / avgValue * 100).toFixed(1);
                                return <Tag color={parseFloat(dev) > 0 ? 'red' : 'blue'}>{dev}%</Tag>;
                              },
                            },
                            { title: '操作', key: 'action', render: () => <Button type="link" size="small">查看详情</Button> },
                          ]}
                          rowKey="fullDate"
                        />
                      }
                      className="mt-4"
                    />
                  )}
                </Card>
              ),
            },
            {
              key: 'stl',
              label: (
                <span><DotChartOutlined /> STL分解</span>
              ),
              children: (
                <Card className="shadow-sm">
                  <Alert
                    type="info"
                    showIcon
                    message="STL（Seasonal and Trend decomposition using Loess）分解"
                    description="将时序数据分解为：长期趋势(Trend)、季节性成分(Seasonal)和残差项(Residual)，帮助理解数据的内在结构。"
                    className="mb-4"
                  />
                  <SafeECharts option={stlDecompositionOption} style={{ height: 420 }} title="STL分解图" />
                </Card>
              ),
            },
            {
              key: 'forecast',
              label: (
                <span><ThunderboltOutlined /> 预测外推</span>
              ),
              children: (
                <Card className="shadow-sm">
                  <Alert
                    type="success"
                    showIcon
                    message="未来7期预测区间"
                    description="基于ARIMA模型对未来数据进行预测，紫色虚线为预测值，浅色区域为95%置信区间。"
                    className="mb-4"
                  />
                  <SafeECharts option={forecastOption} style={{ height: 380 }} title="预测外推图" />

                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">预测结果详情</h4>
                    <Table
                      dataSource={forecastData}
                      size="small"
                      pagination={false}
                      columns={[
                        { title: '日期', dataIndex: 'date', key: 'date' },
                        { title: '预测值', dataIndex: 'predicted', key: 'pred', render: (v: number) => v.toLocaleString() },
                        { title: '置信下限', dataIndex: 'lower', key: 'lower', render: (v: number) => v.toLocaleString(), className: 'text-blue-600' },
                        { title: '置信上限', dataIndex: 'upper', key: 'upper', render: (v: number) => v.toLocaleString(), className: 'text-red-600' },
                        {
                          title: '波动范围',
                          key: 'range',
                          render: (_: any, r: any) => `±${(((r.upper - r.lower) / 2 / r.predicted) * 100).toFixed(1)}%`,
                        },
                      ]}
                      rowKey="date"
                    />
                  </div>
                </Card>
              ),
            },
          ]}
        />
      </div>
    </AdminLayout>
  );
}
