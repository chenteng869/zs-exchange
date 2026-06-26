'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Row, Col, Card, Statistic, Progress, Tag, Badge } from 'antd';
import {
  DashboardOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  UserOutlined,
  FundOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
} from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

// 全局KPI模拟数据
const mockGlobalStats = {
  systemHealth: 96.8,
  activeUsers: 15842,
  dailyTransactions: 285600,
  totalVolume: 58420000,
  securityScore: 92,
  onlineNodes: 24,
  avgLatency: 45,
  errorRate: 0.03,
};

// 实时交易趋势
const realtimeTrendOption = {
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(50,50,50,0.9)', borderColor: '#333', textStyle: { color: '#fff' } },
  legend: { data: ['交易量(T)', '活跃用户(K)', '安全事件'], textStyle: { color: '#aaa' }, top: 5 },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true },
  xAxis: {
    type: 'category',
    data: ['00:00', '02:00', '04:00', '06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'],
    axisLine: { lineStyle: { color: '#333' } },
    axisLabel: { color: '#888' },
  },
  yAxis: {
    type: 'value',
    axisLine: { lineStyle: { color: '#333' } },
    axisLabel: { color: '#888' },
    splitLine: { lineStyle: { color: '#222' } },
  },
  series: [
    {
      name: '交易量(T)',
      type: 'line',
      smooth: true,
      data: [2.1, 0.8, 0.5, 0.6, 3.2, 8.5, 12.3, 15.8, 14.2, 11.5, 9.8, 5.2],
      lineStyle: { color: '#1677FF', width: 2 },
      itemStyle: { color: '#1677FF' },
      areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(24,144,255,0.3)' }, { offset: 1, color: 'rgba(24,144,255,0)' }] } },
    },
    {
      name: '活跃用户(K)',
      type: 'line',
      smooth: true,
      data: [0.8, 0.3, 0.2, 0.15, 1.2, 3.5, 5.8, 7.2, 6.5, 5.0, 4.2, 2.0],
      lineStyle: { color: '#16A34A', width: 2 },
      itemStyle: { color: '#16A34A' },
    },
    {
      name: '安全事件',
      type: 'line',
      smooth: true,
      data: [12, 5, 3, 2, 18, 35, 42, 38, 30, 25, 20, 15],
      lineStyle: { color: '#DC2626', width: 2, type: 'dashed' },
      itemStyle: { color: '#DC2626' },
    },
  ],
};

// 系统资源使用率
const resourceOption = {
  backgroundColor: 'transparent',
  tooltip: { trigger: 'axis', backgroundColor: 'rgba(50,50,50,0.9)', textStyle: { color: '#fff' } },
  legend: { data: ['CPU使用率', '内存使用率', '网络带宽', '磁盘I/O'], textStyle: { color: '#aaa' }, top: 5 },
  grid: { left: '3%', right: '4%', bottom: '3%', top: '40px', containLabel: true },
  xAxis: { type: 'category', data: Array.from({ length: 20 }, (_, i) => `${String(i).padStart(2, '0')}:${(i * 3) % 60 === 0 ? '00' : (i * 3) % 60}`), axisLabel: { color: '#666', fontSize: 10 }, axisLine: { lineStyle: { color: '#222' } } },
  yAxis: { type: 'value', max: 100, axisLabel: { color: '#666', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#1a1a1a' } } },
  series: [
    { name: 'CPU使用率', type: 'line', smooth: true, data: [45,48,42,38,55,62,70,68,65,72,75,68,60,55,58,63,67,64,58,52], lineStyle: { color: '#F59E0B' }, areaStyle: { color: 'rgba(250,173,20,0.1)' } },
    { name: '内存使用率', type: 'line', smooth: true, data: [62,64,61,59,65,68,72,74,73,76,78,75,71,68,70,73,76,74,70,65], lineStyle: { color: '#DC2626' }, areaStyle: { color: 'rgba(255,77,79,0.1)' } },
    { name: '网络带宽', type: 'line', smooth: true, data: [25,22,15,12,35,52,65,72,68,75,80,70,55,40,45,58,65,60,48,32], lineStyle: { color: '#1677FF' }, areaStyle: { color: 'rgba(24,144,255,0.1)' } },
    { name: '磁盘I/O', type: 'line', smooth: true, data: [15,12,8,10,22,28,35,42,38,45,50,42,32,25,28,35,40,36,28,18], lineStyle: { color: '#7C3AED' }, areaStyle: { color: 'rgba(114,46,209,0.1)' } },
  ],
};

// 各子系统状态
const subsystemStatus = [
  { name: '交易平台核心', status: 'healthy', uptime: '99.99%', latency: '12ms' },
  { name: '区块链节点', status: 'healthy', uptime: '99.97%', latency: '45ms' },
  { name: '钱包服务', status: 'healthy', uptime: '99.98%', latency: '23ms' },
  { name: 'KYC/AML系统', status: 'warning', uptime: '99.85%', latency: '85ms' },
  { name: '清算结算', status: 'healthy', uptime: '99.99%', latency: '8ms' },
  { name: '风控引擎', status: 'healthy', uptime: '100%', latency: '5ms' },
  { name: '消息推送服务', status: 'healthy', uptime: '99.95%', latency: '15ms' },
  { name: 'API网关', status: 'healthy', uptime: '99.97%', latency: '3ms' },
];

// 全球节点分布（简化散点）
const nodeDistOption = {
  backgroundColor: 'transparent',
  geo: {
    map: 'world',
    roam: false,
    itemStyle: { areaColor: '#1a1a2e', borderColor: '#16213e' },
    emphasis: { itemStyle: { areaColor: '#0f3460' } },
    label: { show: false },
  },
  series: [{
    type: 'effectScatter',
    coordinateSystem: 'geo',
    symbolSize: (val: number[]) => Math.max(val[2] / 3, 8),
    data: [
      { name: '北京主节点', value: [116.46, 39.92, 85], itemStyle: { color: '#16A34A' } },
      { name: '上海节点', value: [121.48, 31.22, 72], itemStyle: { color: '#16A34A' } },
      { name: '新加坡节点', value: [103.82, 1.35, 68], itemStyle: { color: '#16A34A' } },
      { name: '东京节点', value: [139.69, 35.68, 65], itemStyle: { color: '#16A34A' } },
      { name: '法兰克福节点', value: [8.68, 50.11, 58], itemStyle: { color: '#16A34A' } },
      { name: '纽约节点', value: [-74.0, 40.7, 55], itemStyle: { color: '#16A34A' } },
      { name: '香港节点', value: [114.17, 22.28, 48], itemStyle: { color: '#F59E0B' } },
      { name: '首尔节点', value: [126.98, 37.57, 42], itemStyle: { color: '#16A34A' } },
    ],
    showEffectOn: 'render',
    rippleEffect: { brushType: 'stroke', scale: 3 },
    label: { show: true, formatter: '{b}', color: '#aaa', fontSize: 10 },
  }],
};

export default function GlobalOverviewPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const { data: stats } = useQuery({
    queryKey: ['global-overview-stats'],
    queryFn: async () => { await new Promise(r => setTimeout(r, 500)); return mockGlobalStats; },
    refetchInterval: 30000, // 30秒自动刷新
  });

  // KPI卡片组件样式 - 深色主题
  const kpiCardClass = "bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-all";

  return (
    <AdminLayout>
      <div className="min-h-screen bg-[#0a0e1a] text-white -m-6 p-6">
        {/* 顶部标题栏 */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <DashboardOutlined className="text-3xl text-cyan-400" />
            <div>
              <h1 className="text-2xl font-bold m-0 bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">中萨数字科技交易所 · 全局概览大屏</h1>
              <p className="text-xs text-gray-500 mt-1">ZHONG-SA DIGITAL TECHNOLOGY EXCHANGE · GLOBAL COMMAND CENTER</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-mono text-cyan-400">{currentTime.toLocaleTimeString('zh-CN', { hour12: false })}</div>
            <div className="text-sm text-gray-500">{currentTime.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'long' })}</div>
          </div>
          <Badge status="processing" text={<span className="text-green-400 text-sm">实时数据同步中</span>} />
        </div>

        {/* 核心KPI卡片 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={12} lg={6}>
            <Card className={kpiCardClass} bordered={false}>
              <div className="flex items-center gap-3 mb-2">
                <SafetyCertificateOutlined className="text-2xl text-cyan-400" />
                <span className="text-gray-400 text-sm">系统健康度</span>
              </div>
              <div className="text-3xl font-bold text-green-400">{stats?.systemHealth || 0}<span className="text-lg ml-1">%</span></div>
              <Progress percent={stats?.systemHealth || 0} strokeColor="#16A34A" trailColor="#1a1a2e" size="small" className="mt-2" />
              <div className="flex items-center gap-1 mt-1 text-xs"><ArrowUpOutlined className="text-green-400" /><span className="text-green-400">+0.3%</span><span className="text-gray-500 ml-2">较昨日</span></div>
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className={kpiCardClass} bordered={false}>
              <div className="flex items-center gap-3 mb-2">
                <UserOutlined className="text-2xl text-blue-400" />
                <span className="text-gray-400 text-sm">活跃用户</span>
              </div>
              <div className="text-3xl font-bold text-blue-400">{(stats?.activeUsers || 0).toLocaleString()}</div>
              <div className="text-xs text-gray-500 mt-2">日活(DAU)</div>
              <div className="flex items-center gap-1 mt-1 text-xs"><ArrowUpOutlined className="text-green-400" /><span className="text-green-400">+8.5%</span></div>
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className={kpiCardClass} bordered={false}>
              <div className="flex items-center gap-3 mb-2">
                <FundOutlined className="text-2xl text-yellow-400" />
                <span className="text-gray-400 text-sm">今日交易量</span>
              </div>
              <div className="text-3xl font-bold text-yellow-400">{((stats?.dailyTransactions || 0) / 1000).toFixed(1)}<span className="text-lg ml-1">K笔</span></div>
              <div className="text-xs text-gray-500 mt-2">成交额 ${(stats?.totalVolume || 0 / 1000000).toFixed(1)}M</div>
              <div className="flex items-center gap-1 mt-1 text-xs"><ArrowUpOutlined className="text-green-400" /><span className="text-green-400">+12.3%</span></div>
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card className={kpiCardClass} bordered={false}>
              <div className="flex items-center gap-3 mb-2">
                <ThunderboltOutlined className="text-2xl text-red-400" />
                <span className="text-gray-400 text-sm">安全评分</span>
              </div>
              <div className="text-3xl font-bold text-orange-400">{stats?.securityScore || 0}<span className="text-lg ml-1">/100</span></div>
              <Progress type="dashboard" percent={stats?.securityScore || 0} strokeColor={stats?.securityScore && stats.securityScore >= 90 ? '#16A34A' : '#F59E0B'} size={60} className="mt-1" />
              <div className="text-xs text-gray-500 mt-1">在线节点: {stats?.onlineNodes || 0}</div>
            </Card>
          </Col>
        </Row>

        {/* 次级指标 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={8}><Card className={`${kpiCardClass} text-center`} bordered={false}><Statistic title="平均延迟" value={stats?.avgLatency || 0} suffix="ms" valueStyle={{ color: '#16A34A' }} /></Card></Col>
          <Col xs={8}><Card className={`${kpiCardClass} text-center`} bordered={false}><Statistic title="错误率" value={stats?.errorRate || 0} suffix="%" precision={2} valueStyle={{ color: (stats?.errorRate || 0) < 0.1 ? '#16A34A' : '#F59E0B' }} /></Card></Col>
          <Col xs={8}><Card className={`${kpiCardClass} text-center`} bordered={false}><Statistic title="在线节点" value={stats?.onlineNodes || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#1677FF' }} /></Card></Col>
        </Row>

        {/* 图表区域 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={16}>
            <Card className="bg-gray-900/50 border border-gray-700 rounded-lg" title={<span className="text-white font-bold">实时业务趋势 (24h)</span>} bordered={false}>
              <SafeECharts option={realtimeTrendOption} style={{ height: 320 }} title="实时趋势" />
            </Card>
          </Col>
          <Col xs={24} lg={8}>
            <Card className="bg-gray-900/50 border border-gray-700 rounded-lg" title={<span className="text-white font-bold">全球节点分布</span>} bordered={false}>
              <SafeECharts option={nodeDistOption} style={{ height: 320 }} title="节点分布" />
            </Card>
          </Col>
        </Row>

        {/* 资源监控 + 子系统状态 */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} lg={14}>
            <Card className="bg-gray-900/50 border border-gray-700 rounded-lg" title={<span className="text-white font-bold">系统资源监控 (实时)</span>} bordered={false}>
              <SafeECharts option={resourceOption} style={{ height: 280 }} title="资源监控" />
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card className="bg-gray-900/50 border border-gray-700 rounded-lg" title={<span className="text-white font-bold">各子系统健康状态</span>} bordered={false}>
              <div className="space-y-3 mt-2">
                {subsystemStatus.map((sys, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-gray-800/50 rounded px-3 py-2 hover:bg-gray-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge status={sys.status === 'healthy' ? 'success' : 'warning'} />
                      <span className="text-sm font-medium">{sys.name}</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs">
                      <span className="text-green-400">{sys.uptime}</span>
                      <span className={`px-2 py-0.5 rounded ${parseInt(sys.latency) < 20 ? 'bg-green-900/50 text-green-400' : parseInt(sys.latency) < 50 ? 'bg-yellow-900/50 text-yellow-400' : 'bg-red-900/50 text-red-400'}`}>{sys.latency}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </Col>
        </Row>

        {/* 底部信息栏 */}
        <div className="flex items-center justify-between text-xs text-gray-600 border-t border-gray-800 pt-4">
          <span>© 2024 中萨数字科技交易所 Zhong-Sa Digital Technology Exchange. All Rights Reserved.</span>
          <span>数据刷新周期: 30s | 版本: Command Center v2.1.0 | 节点同步延迟: &lt;100ms</span>
        </div>
      </div>
    </AdminLayout>
  );
}
