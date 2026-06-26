'use client';

import { useState } from 'react';
import {
  Row, Col, Card, Tag, Button, Space, Modal, Descriptions, Statistic, Badge, Typography, Tooltip, message, Progress, Alert, Divider, Table, Select, InputNumber, Slider,
} from 'antd';
import {
  DashboardOutlined, EyeOutlined, SettingOutlined, ReloadOutlined, FullscreenOutlined,
  ThunderboltOutlined, ClockCircleOutlined, WarningOutlined, CheckCircleOutlined,
  ApiOutlined, CloudServerOutlined, LineChartOutlined, SafetyCertificateOutlined,
  HeartOutlined, ArrowUpOutlined, ArrowDownOutlined, MinusOutlined,
  MonitorOutlined, NodeIndexOutlined, TeamOutlined, DatabaseOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

// 模拟Agent监控数据
const mockAgents = [
  {
    id: 'AGENT-MON-001', name: 'SecurityGuard-Pro', status: 'healthy', healthScore: 98,
    callsToday: 15842, avgLatency: 145, errorRate: 0.2, cpuUsage: 62, memoryUsage: 78,
    gpuUsage: 45, uptime: '15d 8h', version: 'v4.2.0', region: 'cn-east',
    endpoints: ['/api/v1/security/detect', '/api/v1/security/scan'],
  },
  {
    id: 'AGENT-MON-002', name: 'RiskEngine-Q', status: 'healthy', healthScore: 96,
    callsToday: 8935, avgLatency: 230, errorRate: 0.5, cpuUsage: 71, memoryUsage: 82,
    gpuUsage: 58, uptime: '22d 3h', version: 'v3.1.0', region: 'cn-east',
    endpoints: ['/api/v1/risk/assess', '/api/v1/rank/predict'],
  },
  {
    id: 'AGENT-MON-003', name: 'NLP-CS-Bot', status: 'healthy', healthScore: 99,
    callsToday: 24580, avgLatency: 89, errorRate: 0.1, cpuUsage: 55, memoryUsage: 68,
    gpuUsage: 32, uptime: '30d 12h', version: 'v2.5.0', region: 'cn-south',
    endpoints: ['/api/v1/chat/completions', '/api/v1/embeddings'],
  },
  {
    id: 'AGENT-MON-004', name: 'ContractAuditor', status: 'warning', healthScore: 82,
    callsToday: 3210, avgLatency: 890, errorRate: 2.3, cpuUsage: 88, memoryUsage: 91,
    gpuUsage: 75, uptime: '5d 6h', version: 'v2.0.0', region: 'cn-east',
    endpoints: ['/api/v1/audit/solidity', '/api/v1/audit/gas'],
  },
  {
    id: 'AGENT-MON-005', name: 'PricePredictor', status: 'degraded', healthScore: 71,
    callsToday: 5620, avgLatency: 450, errorRate: 3.8, cpuUsage: 94, memoryUsage: 95,
    gpuUsage: 88, uptime: '2d 14h', version: 'v1.8.0', region: 'us-west',
    endpoints: ['/api/v1/predict/price', '/api/v1/predict/trend'],
  },
  {
    id: 'AGENT-MON-006', name: 'IdentityVerifier', status: 'healthy', healthScore: 95,
    callsToday: 12890, avgLatency: 178, errorRate: 0.3, cpuUsage: 58, memoryUsage: 72,
    gpuUsage: 42, uptime: '18d 1h', version: 'v3.0.0', region: 'cn-south',
    endpoints: ['/api/v1/kyc/verify', '/api/v1/ocr/extract'],
  },
  {
    id: 'AGENT-MON-007', name: 'ContentMod-AI', status: 'healthy', healthScore: 97,
    callsToday: 18934, avgLatency: 112, errorRate: 0.15, cpuUsage: 65, memoryUsage: 74,
    gpuUsage: 51, uptime: '12d 9h', version: 'v2.2.0', region: 'cn-east',
    endpoints: ['/api/v1/moderate/text', '/api/v1/moderate/image'],
  },
  {
    id: 'AGENT-MON-008', name: 'DataPipeline-ETL', status: 'offline', healthScore: 0,
    callsToday: 0, avgLatency: 0, errorRate: 100, cpuUsage: 0, memoryUsage: 0,
    gpuUsage: 0, uptime: '-', version: 'v2.8.0', region: 'cn-east',
    endpoints: ['/api/v1/etl/run', '/api/v1/etl/status'],
  },
  {
    id: 'AGENT-MON-009', name: 'SentimentAnalyzer', status: 'healthy', healthScore: 93,
    callsToday: 8456, avgLatency: 195, errorRate: 0.6, cpuUsage: 69, memoryUsage: 79,
    gpuUsage: 55, uptime: '8d 15h', version: 'v1.9.0', region: 'us-west',
    endpoints: ['/api/v1/sentiment/analyze', '/api/v1/trends/fetch'],
  },
  {
    id: 'AGENT-MON-010', name: 'TradingBot-FW', status: 'healthy', healthScore: 94,
    callsToday: 12340, avgLatency: 67, errorRate: 0.08, cpuUsage: 45, memoryUsage: 58,
    gpuUsage: 28, uptime: '25d 4h', version: 'v1.5.0', region: 'cn-east',
    endpoints: ['/api/v1/trade/execute', '/api/v1/backtest/run'],
  },
];

// 状态颜色和图标
const healthStatusConfig: Record<string, { color: string; text: string; icon: React.ReactNode; bgColor: string }> = {
  healthy: { color: 'green', text: '健康', icon: <CheckCircleOutlined />, bgColor: 'bg-green-50' },
  warning: { color: 'orange', text: '警告', icon: <WarningOutlined />, bgColor: 'bg-orange-50' },
  degraded: { color: 'red', text: '降级', icon: <WarningOutlined />, bgColor: 'bg-red-50' },
  offline: { color: 'default', text: '离线', icon: <MinusOutlined />, bgColor: 'bg-gray-50' },
};

export default function MonitorDashboardPage() {
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<any>(null);

  // 统计数据
  const onlineAgents = mockAgents.filter(a => a.status !== 'offline').length;
  const totalCalls = mockAgents.reduce((sum, a) => sum + a.callsToday, 0);
  const avgLatency = Math.round(mockAgents.filter(a => a.status !== 'offline').reduce((sum, a) => sum + a.avgLatency, 0) / onlineAgents);
  const avgErrorRate = (mockAgents.filter(a => a.status !== 'offline').reduce((sum, a) => sum + a.errorRate, 0) / onlineAgents).toFixed(2);
  const avgResource = Math.round(mockAgents.filter(a => a.status !== 'offline').reduce((sum, a) => sum + a.cpuUsage + a.memoryUsage, 0) / (onlineAgents * 2));

  const columns = [
    {
      title: 'Agent实例',
      key: 'agent',
      width: 240,
      render: (_: any, record: any) => {
        const config = healthStatusConfig[record.status];
        return (
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${config?.bgColor || 'bg-gray-50'} ${
              record.status === 'healthy' ? 'text-green-600' :
              record.status === 'warning' ? 'text-orange-600' :
              record.status === 'degraded' ? 'text-red-600' : 'text-gray-400'
            }`}>
              <MonitorOutlined style={{ fontSize: 18 }} />
            </div>
            <div>
              <div className="font-semibold text-sm">{record.name}</div>
              <div className="text-xs text-gray-400">{record.version} · {record.region}</div>
            </div>
          </div>
        );
      },
    },
    {
      title: '健康状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string, record: any) => {
        const config = healthStatusConfig[status];
        if (!config) return status;
        return (
          <div>
            <Badge status={config.color as any} text={
              <span className="flex items-center gap-1">
                {config.text}
                <span className={config.color === 'green' ? 'text-green-600' : config.color === 'red' ? 'text-red-600' : 'text-orange-600'}>
                  {record.healthScore}分
                </span>
              </span>
            } />
          </div>
        );
      },
    },
    {
      title: '今日调用量',
      dataIndex: 'callsToday',
      key: 'callsToday',
      width: 110,
      align: 'right' as const,
      render: (val: number) => val > 0 ? val.toLocaleString() : <span className="text-gray-400">-</span>,
    },
    {
      title: '平均延迟(ms)',
      dataIndex: 'avgLatency',
      key: 'avgLatency',
      width: 120,
      align: 'right' as const,
      render: (latency: number) => latency > 0 ? (
        <span className={latency < 200 ? 'text-green-600' : latency < 500 ? 'text-orange-500' : 'text-red-500'}>
          {latency}ms
        </span>
      ) : <span className="text-gray-400">-</span>,
    },
    {
      title: '错误率',
      dataIndex: 'errorRate',
      key: 'errorRate',
      width: 90,
      align: 'right' as const,
      render: (rate: number) => rate < 1 ? (
        <Tag color="green">{rate}%</Tag>
      ) : rate < 3 ? (
        <Tag color="orange">{rate}%</Tag>
      ) : (
        <Tag color="red">{rate}%</Tag>
      ),
    },
    {
      title: 'CPU / 内存',
      key: 'resource',
      width: 140,
      render: (_: any, record: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-8">CPU</span>
            <Progress
              percent={record.cpuUsage}
              size="small"
              strokeColor={record.cpuUsage > 85 ? '#DC2626' : record.cpuUsage > 70 ? '#F59E0B' : '#16A34A'}
              format={percent => `${percent}%`}
              className="flex-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-8">MEM</span>
            <Progress
              percent={record.memoryUsage}
              size="small"
              strokeColor={record.memoryUsage > 85 ? '#DC2626' : record.memoryUsage > 70 ? '#F59E0B' : '#16A34A'}
              format={percent => `${percent}%`}
              className="flex-1"
            />
          </div>
        </div>
      ),
    },
    {
      title: '运行时间',
      dataIndex: 'uptime',
      key: 'uptime',
      width: 100,
      render: (uptime: string) => <span className="text-xs">{uptime}</span>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedAgent(record); setDetailDrawerVisible(true); }} />
          </Tooltip>
          {record.status !== 'offline' && (
            <Tooltip title="重启服务">
              <Button type="text" size="small" icon={<ReloadOutlined />} onClick={() => message.success(`${record.name} 重启请求已发送`)} />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DashboardOutlined className="text-2xl text-violet-600" />
            <h1 className="text-2xl font-bold m-0">监控大屏</h1>
          </div>
          <Space>
            <Button icon={<FullscreenOutlined />}>全屏模式</Button>
            <Button icon={<ReloadOutlined />} onClick={() => message.info('数据已刷新')}>刷新</Button>
            <Select
              defaultValue="all"
              style={{ width: 120 }}
              options={[
                { label: '全部区域', value: 'all' },
                { label: '华东', value: 'cn-east' },
                { label: '华南', value: 'cn-south' },
                { label: '美西', value: 'us-west' },
              ]}
            />
          </Space>
        </div>

        {/* 数据卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="在线Agent"
              value={`${onlineAgents}/${mockAgents.length}`}
              icon={<TeamOutlined />}
              color="#16A34A"
              description={`${mockAgents.length - onlineAgents} 个离线`}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="总调用量"
              value={totalCalls.toLocaleString()}
              icon={<ThunderboltOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+15.3%"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="平均延迟"
              value={`${avgLatency}ms`}
              icon={<ClockCircleOutlined />}
              color={avgLatency < 200 ? '#16A34A' : avgLatency < 500 ? '#F59E0B' : '#DC2626'}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="平均错误率"
              value={`${avgErrorRate}%`}
              icon={<WarningOutlined />}
              color={parseFloat(avgErrorRate) < 1 ? '#16A34A' : parseFloat(avgErrorRate) < 3 ? '#F59E0B' : '#DC2626'}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="平均资源占用"
              value={`${avgResource}%`}
              icon={<CloudServerOutlined />}
              color={avgResource > 80 ? '#DC2626' : avgResource > 60 ? '#F59E0B' : '#16A34A'}
            />
          </Col>
        </Row>

        {/* Agent监控列表 */}
        <DataTable
          columns={columns}
          dataSource={mockAgents}
          rowKey="id"
          title="Agent运行状态监控"
          showSearch
          searchPlaceholder="搜索Agent名称..."
          showFilter
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '健康', value: 'healthy' },
            { label: '警告', value: 'warning' },
            { label: '降级', value: 'degraded' },
            { label: '离线', value: 'offline' },
          ]}
          pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 个Agent` }}
        />

        {/* 系统健康概览 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title={<span><SafetyCertificateOutlined /> 服务健康分布</span>} className="shadow-sm" size="small">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Space><Badge status="success" text="健康运行" /><span className="text-sm text-gray-500">{mockAgents.filter(a => a.status === 'healthy').length} 个Agent</span></Space>
                  <Progress percent={Math.round((mockAgents.filter(a => a.status === 'healthy').length / mockAgents.length) * 100)} size="small" strokeColor="#16A34A" style={{ width: 120 }} />
                </div>
                <div className="flex items-center justify-between">
                  <Space><Badge status="warning" text="需要关注" /><span className="text-sm text-gray-500">{mockAgents.filter(a => a.status === 'warning').length} 个Agent</span></Space>
                  <Progress percent={Math.round((mockAgents.filter(a => a.status === 'warning').length / mockAgents.length) * 100)} size="small" strokeColor="#F59E0B" style={{ width: 120 }} />
                </div>
                <div className="flex items-center justify-between">
                  <Space><Badge status="error" text="性能降级" /><span className="text-sm text-gray-500">{mockAgents.filter(a => a.status === 'degraded').length} 个Agent</span></Space>
                  <Progress percent={Math.round((mockAgents.filter(a => a.status === 'degraded').length / mockAgents.length) * 100)} size="small" strokeColor="#DC2626" style={{ width: 120 }} />
                </div>
                <div className="flex items-center justify-between">
                  <Space><Badge status="default" text="离线" /><span className="text-sm text-gray-500">{mockAgents.filter(a => a.status === 'offline').length} 个Agent</span></Space>
                  <Progress percent={Math.round((mockAgents.filter(a => a.status === 'offline').length / mockAgents.length) * 100)} size="small" strokeColor="#9CA3AF" style={{ width: 120 }} />
                </div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title={<span><LineChartOutlined /> 区域调用分布</span>} className="shadow-sm" size="small">
              <div className="space-y-3">
                {['cn-east', 'cn-south', 'us-west'].map(region => {
                  const agentsInRegion = mockAgents.filter(a => a.region === region);
                  const callsInRegion = agentsInRegion.reduce((sum, a) => sum + a.callsToday, 0);
                  const regionNames: Record<string, string> = { 'cn-east': '华东集群', 'cn-south': '华南集群', 'us-west': '美西集群' };
                  const regionColors: Record<string, string> = { 'cn-east': '#1677FF', 'cn-south': '#16A34A', 'us-west': '#7C3AED' };
                  return (
                    <div key={region} className="flex items-center justify-between">
                      <span className="text-sm">{regionNames[region]}</span>
                      <div className="flex items-center gap-3 flex-1 ml-4">
                        <Progress
                          percent={Math.round((callsInRegion / totalCalls) * 100)}
                          size="small"
                          strokeColor={regionColors[region]}
                          style={{ flex: 1 }}
                          format={percent => `${callsInRegion.toLocaleString()} 次`}
                        />
                        <span className="text-xs text-gray-400 w-12 text-right">{agentsInRegion.length} 台</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Col>
        </Row>

        {/* 详情抽屉 */}
        <Modal
          title={`Agent详情 - ${selectedAgent?.name}`}
          open={detailDrawerVisible}
          onCancel={() => setDetailDrawerVisible(false)}
          width={700}
          footer={<Button onClick={() => setDetailDrawerVisible(false)}>关闭</Button>}
        >
          {selectedAgent && (
            <div className="space-y-4">
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="Agent ID"><Text code>{selectedAgent.id}</Text></Descriptions.Item>
                <Descriptions.Item label="健康状态">{(() => { const config = healthStatusConfig[selectedAgent.status]; return config ? <Tag color={config.color} icon={config.icon}>{config.text}</Tag> : selectedAgent.status; })()}</Descriptions.Item>
                <Descriptions.Item label="健康评分" span={2}>
                  <div className="flex items-center gap-3">
                    <Progress
                      type="circle"
                      percent={selectedAgent.healthScore}
                      size={60}
                      strokeColor={selectedAgent.healthScore >= 90 ? '#16A34A' : selectedAgent.healthScore >= 70 ? '#F59E0B' : '#DC2626'}
                      format={percent => `${percent}`}
                    />
                    <span className="text-sm text-gray-500">
                      {selectedAgent.healthScore >= 90 ? '运行状态优秀' : selectedAgent.healthScore >= 70 ? '存在性能瓶颈' : '需要紧急处理'}
                    </span>
                  </div>
                </Descriptions.Item>
                <Descriptions.Item label="今日调用量">{selectedAgent.callsToday.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="平均延迟">{selectedAgent.avgLatency > 0 ? `${selectedAgent.avgLatency}ms` : '-'}</Descriptions.Item>
                <Descriptions.Item label="错误率"><Text type={selectedAgent.errorRate < 1 ? 'success' : selectedAgent.errorRate < 3 ? 'warning' : 'danger'}>{selectedAgent.errorRate}%</Text></Descriptions.Item>
                <Descriptions.Item label="运行时间">{selectedAgent.uptime}</Descriptions.Item>
                <Descriptions.Item label="版本">{selectedAgent.version}</Descriptions.Item>
                <Descriptions.Item label="所在区域">{selectedAgent.region}</Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">资源使用情况</Divider>
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic title="CPU使用率" value={selectedAgent.cpuUsage} suffix="%" valueStyle={{ color: selectedAgent.cpuUsage > 85 ? '#DC2626' : '#1677FF' }} />
                </Col>
                <Col span={8}>
                  <Statistic title="内存使用率" value={selectedAgent.memoryUsage} suffix="%" valueStyle={{ color: selectedAgent.memoryUsage > 85 ? '#DC2626' : '#1677FF' }} />
                </Col>
                <Col span={8}>
                  <Statistic title="GPU使用率" value={selectedAgent.gpuUsage} suffix="%" valueStyle={{ color: selectedAgent.gpuUsage > 80 ? '#F59E0B' : '#1677FF' }} />
                </Col>
              </Row>

              <Divider orientation="left">API端点</Divider>
              <div className="space-y-2">
                {selectedAgent.endpoints.map((ep: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                    <Badge status="processing" />
                    <Text code className="!text-xs !bg-transparent">{ep}</Text>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
