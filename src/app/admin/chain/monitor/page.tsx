'use client';

import { useState } from 'react';
import { Card, Row, Col, Table, Tag, Button, Space, Badge, Statistic, Progress, Alert, Tabs } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import SafeECharts from '@/components/admin/SafeECharts';
import AdminLayout from '@/components/admin/AdminLayout';

const mockAlerts = [
  { id: '1', level: 'warning', title: '节点延迟过高', message: '主网节点-02延迟超过50ms', time: '5分钟前', node: '主网节点-02' },
  { id: '2', level: 'error', title: '节点同步失败', message: '归档节点-01同步停止，区块高度落后', time: '10分钟前', node: '归档节点-01' },
  { id: '3', level: 'info', title: '新区块确认', message: '区块 #18542300 已确认', time: '1分钟前', node: '主网节点-01' },
  { id: '4', level: 'warning', title: 'Gas费用上涨', message: '当前Gas费用高于平均水平30%', time: '3分钟前', node: '系统' },
];

const mockNodeMetrics = [
  { name: '主网节点-01', cpu: 45, memory: 68, disk: 72, network: 85, status: 'healthy' },
  { name: '主网节点-02', cpu: 72, memory: 81, disk: 65, network: 45, status: 'warning' },
  { name: '备用节点-01', cpu: 35, memory: 52, disk: 48, network: 72, status: 'healthy' },
  { name: '归档节点-01', cpu: 12, memory: 95, disk: 98, network: 15, status: 'critical' },
];

const networkLatencyOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
  yAxis: { type: 'value', name: '延迟(ms)' },
  series: [
    { type: 'line', smooth: true, data: [12, 15, 25, 18, 32, 28, 14], areaStyle: { color: 'rgba(52, 211, 153, 0.3)' }, name: '平均延迟' },
  ],
};

const throughputOption = {
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'] },
  yAxis: { type: 'value', name: '交易数/秒' },
  series: [
    { type: 'bar', data: [1200, 1500, 1350, 1800, 1600, 2100, 1950], itemStyle: { color: '#1677FF' } },
  ],
};

const gasPriceOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00'] },
  yAxis: { type: 'value', name: 'Gwei' },
  series: [
    { type: 'line', smooth: true, data: [35, 42, 58, 45, 62, 55, 48], lineStyle: { color: '#F59E0B' }, itemStyle: { color: '#F59E0B' }, name: 'Gas价格' },
  ],
};

const blockTimeOption = {
  tooltip: { trigger: 'axis' },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', data: ['区块1', '区块2', '区块3', '区块4', '区块5', '区块6', '区块7'] },
  yAxis: { type: 'value', name: '时间(秒)' },
  series: [
    { type: 'scatter', data: [[0, 4.8], [1, 5.2], [2, 4.9], [3, 5.1], [4, 5.3], [5, 4.7], [6, 5.0]], itemStyle: { color: '#7C3AED' } },
  ],
};

export default function ChainMonitorPage() {
  const [selectedNode, setSelectedNode] = useState<string | null>(null);

  const alertColumns = [
    { 
      title: '级别', 
      dataIndex: 'level', 
      key: 'level', 
      render: (level: string) => {
        const colors: Record<string, 'error' | 'warning' | 'default'> = { error: 'error', warning: 'warning', info: 'default' };
        return <Badge status={colors[level]} />;
      },
    },
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '消息', dataIndex: 'message', key: 'message' },
    { title: '关联节点', dataIndex: 'node', key: 'node' },
    { title: '时间', dataIndex: 'time', key: 'time' },
  ];

  const nodeColumns = [
    { title: '节点名称', dataIndex: 'name', key: 'name', render: (text: string) => <span className="font-semibold text-blue-600">{text}</span> },
    { 
      title: 'CPU', 
      dataIndex: 'cpu', 
      key: 'cpu', 
      render: (val: number) => (
        <div className="flex items-center gap-2">
          <TrophyOutlined className="text-sm" />
          <Progress percent={val} strokeColor={val > 80 ? '#DC2626' : val > 60 ? '#F59E0B' : '#16A34A'} size="small" showInfo={false} />
          <span className="text-sm">{val}%</span>
        </div>
      ),
    },
    { 
      title: '内存', 
      dataIndex: 'memory', 
      key: 'memory', 
      render: (val: number) => (
        <div className="flex items-center gap-2">
          <TrophyOutlined className="text-sm" />
          <Progress percent={val} strokeColor={val > 90 ? '#DC2626' : val > 70 ? '#F59E0B' : '#16A34A'} size="small" showInfo={false} />
          <span className="text-sm">{val}%</span>
        </div>
      ),
    },
    { 
      title: '磁盘', 
      dataIndex: 'disk', 
      key: 'disk', 
      render: (val: number) => (
        <div className="flex items-center gap-2">
          <TrophyOutlined className="text-sm" />
          <Progress percent={val} strokeColor={val > 95 ? '#DC2626' : val > 80 ? '#F59E0B' : '#16A34A'} size="small" showInfo={false} />
          <span className="text-sm">{val}%</span>
        </div>
      ),
    },
    { 
      title: '网络', 
      dataIndex: 'network', 
      key: 'network', 
      render: (val: number) => (
        <div className="flex items-center gap-2">
          <TrophyOutlined className="text-sm" />
          <Progress percent={val} strokeColor={val < 30 ? '#DC2626' : val < 60 ? '#F59E0B' : '#16A34A'} size="small" showInfo={false} />
          <span className="text-sm">{val}%</span>
        </div>
      ),
    },
    { 
      title: '状态', 
      dataIndex: 'status', 
      key: 'status', 
      render: (status: string) => {
        const statusConfig: Record<string, { color: 'success' | 'warning' | 'error'; label: string }> = {
          healthy: { color: 'success', label: '健康' },
          warning: { color: 'warning', label: '警告' },
          critical: { color: 'error', label: '严重' },
        };
        const config = statusConfig[status];
        return <Badge status={config?.color} text={config?.label} />;
      },
    },
  ];

  const networkStatus = 'healthy';
  const totalNodes = 6;
  const activeNodes = 5;
  const avgLatency = 18;
  const avgBlockTime = 5.0;
  const txPerSecond = 1850;
  const gasPrice = 45;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <TrophyOutlined className="text-2xl text-red-600" />
            <h1 className="text-2xl font-bold m-0">网络监控</h1>
          </div>
          <Space>
            <Badge status={networkStatus === 'healthy' ? 'success' : networkStatus === 'warning' ? 'warning' : 'error'} />
            <span className={networkStatus === 'healthy' ? 'text-green-600' : networkStatus === 'warning' ? 'text-yellow-600' : 'text-red-600'}>
              {networkStatus === 'healthy' ? '网络正常' : networkStatus === 'warning' ? '存在警告' : '存在故障'}
            </span>
          </Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <TrophyOutlined className="text-blue-500" />
                <span className="text-gray-500 text-sm">节点状态</span>
              </div>
              <Statistic title={`${activeNodes}/${totalNodes}`} valueStyle={{ color: '#1677FF' }} />
              <div className="text-green-500 text-sm mt-1">运行中</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <TrophyOutlined className="text-green-500" />
                <span className="text-gray-500 text-sm">平均延迟</span>
              </div>
              <Statistic title={avgLatency} suffix="ms" valueStyle={{ color: '#16A34A' }} />
              <div className="text-gray-400 text-sm mt-1">网络延迟监控</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="text-gray-500 text-sm mb-2">出块时间</div>
              <Statistic title={avgBlockTime} suffix="秒" valueStyle={{ color: '#7C3AED' }} />
              <div className="text-gray-400 text-sm mt-1">平均区块间隔</div>
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <div className="flex items-center gap-2 mb-2">
                <TrophyOutlined className="text-orange-500" />
                <span className="text-gray-500 text-sm">TPS</span>
              </div>
              <Statistic title={txPerSecond} suffix="/秒" valueStyle={{ color: '#F59E0B' }} />
              <div className="text-gray-400 text-sm mt-1">交易吞吐量</div>
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="网络延迟趋势">
              <SafeECharts option={networkLatencyOption} style={{ height: 250 }} title="网络延迟趋势" />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="交易吞吐量">
              <SafeECharts option={throughputOption} style={{ height: 250 }} title="交易吞吐量" />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card title="Gas价格走势">
              <SafeECharts option={gasPriceOption} style={{ height: 250 }} title="Gas价格走势" />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title="出块时间分布">
              <SafeECharts option={blockTimeOption} style={{ height: 250 }} title="出块时间分布" />
            </Card>
          </Col>
        </Row>

        <Tabs defaultActiveKey="nodes" items={[
          { 
            key: 'nodes', 
            label: '节点监控',
            children: (
              <Card title="节点资源使用">
                <Table
                  dataSource={mockNodeMetrics}
                  columns={nodeColumns}
                  pagination={{ pageSize: 10 }}
                  rowKey="name"
                />
              </Card>
            )
          },
          { 
            key: 'alerts', 
            label: '告警日志',
            children: (
              <Card title="系统告警">
                <Alert
                  message="实时告警"
                  description="以下是最近的系统告警信息"
                  type="info"
                  showIcon
                  className="mb-4"
                />
                <Table
                  dataSource={mockAlerts}
                  columns={alertColumns}
                  pagination={{ pageSize: 10 }}
                  rowKey="id"
                />
              </Card>
            )
          },
        ]} />
      </div>
    </AdminLayout>
  );
}