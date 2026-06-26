'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { Button, Space, Tag, Modal, message, Select, Table, Card, Progress, Tooltip, Divider, Descriptions } from 'antd';
import { SearchOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, ApiOutlined, ExperimentOutlined, FileTextOutlined, MonitorOutlined, ThunderboltOutlined, ToolOutlined, CheckCircleOutlined, WarningOutlined, StarFilled as StarIcon } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

const { Option } = Select;

interface AiopcTool {
  id: string;
  toolName: string;
  toolCategory: 'quantum_compute' | 'causal_inference' | 'multimodal_fusion' | 'predictive_model' | 'risk_engine';
  description: string;
  apiEndpoint: string;
  status: 'online' | 'degraded' | 'maintenance';
  avgLatencyMs: number;
  requestsToday: number;
  successRate: number;
  version: string;
  lastUpdated: string;
  docsUrl: string;
  requiredPermissions: string[];
}

const mockTools: AiopcTool[] = [
  { id: '1', toolName: '量子增强优化引擎', toolCategory: 'quantum_compute', description: '基于量子退火算法的组合优化求解器，适用于投资组合优化和路径规划', apiEndpoint: '/api/v1/quantum/optimize', status: 'online', avgLatencyMs: 450, requestsToday: 12580, successRate: 99.2, version: 'v3.2.1', lastUpdated: '2024-06-23T02:00:00Z', docsUrl: '/docs/quantum-engine', requiredPermissions: ['quantum:read', 'optimize:execute'] },
  { id: '2', toolName: '超级因果推理平台', toolCategory: 'causal_inference', description: '基于Do-Calculus的因果发现和效应估计系统，支持反事实分析', apiEndpoint: '/api/v1/causal/infer', status: 'online', avgLatencyMs: 1200, requestsToday: 8340, successRate: 97.8, version: 'v2.8.5', lastUpdated: '2024-06-22T18:00:00Z', docsUrl: '/docs/causal-platform', requiredPermissions: ['causal:read', 'causal:write'] },
  { id: '3', toolName: '多模态融合分析器', toolCategory: 'multimodal_fusion', description: '融合文本、图像、时序数据的统一表征学习模型', apiEndpoint: '/api/v1/multimodal/fuse', status: 'online', avgLatencyMs: 800, requestsToday: 15620, successRate: 98.5, version: 'v4.1.0', lastUpdated: '2024-06-23T06:00:00Z', docsUrl: '/docs/multimodal-fusion', requiredPermissions: ['multimodal:read', 'ai:model_access'] },
  { id: '4', toolName: '预测模型工厂', toolCategory: 'predictive_model', description: '自动化机器学习管道，支持时间序列预测、分类和回归任务', apiEndpoint: '/api/v1/predict/train', status: 'degraded', avgLatencyMs: 2100, requestsToday: 9450, successRate: 95.1, version: 'v3.5.2', lastUpdated: '2024-06-21T14:00:00Z', docsUrl: '/docs/predict-factory', requiredPermissions: ['predict:read', 'predict:train'] },
  { id: '5', toolName: '实时风险引擎', toolCategory: 'risk_engine', description: '毫秒级风险计算和预警系统，支持VaR、ES、压力测试', apiEndpoint: '/api/v1/risk/calculate', status: 'online', avgLatencyMs: 35, requestsToday: 892000, successRate: 99.9, version: 'v5.0.3', lastUpdated: '2024-06-23T08:00:00Z', docsUrl: '/docs/risk-engine', requiredPermissions: ['risk:read', 'risk:realtime'] },
  { id: '6', toolName: '量子蒙特卡洛模拟器', toolCategory: 'quantum_compute', description: '量子增强的蒙特卡洛模拟，用于衍生品定价和风险管理', apiEndpoint: '/api/v1/quantum/mc', status: 'maintenance', avgLatencyMs: 3200, requestsToday: 2340, successRate: 92.3, version: 'v2.1.0', lastUpdated: '2024-06-20T10:00:00Z', docsUrl: '/docs/qmc-simulator', requiredPermissions: ['quantum:read', 'quantum:premium'] },
  { id: '7', toolName: '因果图自动构建器', toolCategory: 'causal_inference', description: '从数据中自动发现因果关系的有向无环图生成工具', apiEndpoint: '/api/v1/causal/discover', status: 'online', avgLatencyMs: 2800, requestsToday: 3120, successRate: 96.5, version: 'v1.9.3', lastUpdated: '2024-06-22T22:00:00Z', docsUrl: '/docs/causal-discover', requiredPermissions: ['causal:read', 'causal:advanced'] },
  { id: '8', toolName: '跨模态语义对齐器', toolCategory: 'multimodal_fusion', description: '实现不同模态之间语义空间的对齐和检索增强', apiEndpoint: '/api/v1/multimodal/align', status: 'online', avgLatencyMs: 650, requestsToday: 7890, successRate: 98.9, version: 'v2.4.1', lastUpdated: '2024-06-23T04:00:00Z', docsUrl: '/docs/crossmodal-align', requiredPermissions: ['multimodal:read', 'embedding:access'] },
  { id: '9', toolName: '异常检测与预警', toolCategory: 'predictive_model', description: '基于孤立森林和LSTM的实时异常检测系统', apiEndpoint: '/api/v1/predict/anomaly', status: 'online', avgLatencyMs: 88, requestsToday: 245000, successRate: 99.7, version: 'v4.2.0', lastUpdated: '2024-06-23T07:00:00Z', docsUrl: '/docs/anomaly-detect', requiredPermissions: ['predict:read', 'alert:manage'] },
  { id: '10', toolName: '智能风控决策引擎', toolCategory: 'risk_engine', description: '结合规则引擎和ML模型的复合风控决策系统', apiEndpoint: '/api/v1/risk/decision', status: 'online', avgLatencyMs: 120, requestsToday: 567000, successRate: 99.8, version: 'v6.1.0', lastUpdated: '2024-06-23T09:00:00Z', docsUrl: '/docs/risk-decision', requiredPermissions: ['risk:read', 'risk:decision', 'admin:audit'] },
];

const categoryConfig: Record<string, { label: string; color: string }> = {
  quantum_compute: { label: '量子计算', color: '#7C3AED' },
  causal_inference: { label: '因果推理', color: '#1677FF' },
  multimodal_fusion: { label: '多模态融合', color: '#16A34A' },
  predictive_model: { label: '预测模型', color: '#F59E0B' },
  risk_engine: { label: '风险引擎', color: '#DC2626' },
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  online: { label: '在线', color: 'success', icon: <CheckCircleOutlined /> },
  degraded: { label: '降级', color: 'warning', icon: <WarningOutlined /> },
  maintenance: { label: '维护中', color: 'error', icon: <ToolOutlined /> },
};

export default function AiopcToolsPage() {
  const [selectedTool, setSelectedTool] = useState<AiopcTool | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const filteredTools = mockTools.filter((t) => {
    if (filterCategory && t.toolCategory !== filterCategory) return false;
    if (filterStatus && t.status !== filterStatus) return false;
    return true;
  });

  const totalTools = mockTools.length;
  const onlineCount = mockTools.filter(t => t.status === 'online').length;
  const totalRequests = mockTools.reduce((sum, t) => sum + t.requestsToday, 0);
  const avgSuccessRate = Math.round(mockTools.reduce((sum, t) => sum + t.successRate, 0) / totalTools * 10) / 10;
  const avgLatency = Math.round(mockTools.reduce((sum, t) => sum + t.avgLatencyMs, 0) / totalTools);

  const columns = [
    { title: '工具名称', dataIndex: 'toolName', key: 'toolName', render: (t: string) => <span className="font-semibold text-blue-600">{t}</span> },
    { title: '类别', dataIndex: 'toolCategory', key: 'toolCategory', render: (c: string) => <Tag color={categoryConfig[c]?.color}>{categoryConfig[c]?.label}</Tag> },
    { title: '描述', dataIndex: 'description', key: 'description', width: 200, ellipsis: true, render: (t: string) => <span className="text-xs text-gray-600">{t}</span> },
    { title: 'API端点', dataIndex: 'apiEndpoint', key: 'apiEndpoint', render: (v: string) => <code className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">{v}</code> },
    { title: '状态', dataIndex: 'status', key: 'status', render: (s: string) => <Tag color={statusConfig[s]?.color} icon={statusConfig[s]?.icon}>{statusConfig[s]?.label}</Tag> },
    { title: '延迟ms', dataIndex: 'avgLatencyMs', key: 'avgLatencyMs', render: (v: number) => <span style={{ color: v > 2000 ? '#DC2626' : v > 1000 ? '#F59E0B' : '#16A34A' }}>{v}</span> },
    { title: '今日请求', dataIndex: 'requestsToday', key: 'requestsToday', render: (v: number) => v.toLocaleString() },
    { title: '成功率%', dataIndex: 'successRate', key: 'successRate', render: (v: number) => <Progress percent={Math.round(v)} size="small" style={{ width: 70 }} strokeColor={v >= 99 ? '#52c41a' : v >= 95 ? '#faad14' : '#ff4d4f'} /> },
    { title: '版本', dataIndex: 'version', key: 'version', render: (v: string) => <Tag color="blue">{v}</Tag> },
    { title: '更新时间', dataIndex: 'lastUpdated', key: 'lastUpdated', render: (v: string) => dayjs(v).format('MM-DD HH:mm') },
    { title: '权限要求', dataIndex: 'requiredPermissions', key: 'requiredPermissions', width: 150, ellipsis: true, render: (p: string[]) => p.map(perm => <Tag key={perm} className="mb-1">{perm.split(':')[1]}</Tag>) },
  ];

  const actions: any[] = [
    { key: 'view', label: '详情', icon: <EyeOutlined />, onClick: (record: AiopcTool) => { setSelectedTool(record); setDetailModalOpen(true); } },
    { key: 'test', label: '测试', icon: <ExperimentOutlined />, onClick: (record: AiopcTool) => message.info(`调用测试: ${record.toolName}`) },
    { key: 'docs', label: '文档', icon: <FileTextOutlined />, onClick: (record: AiopcTool) => window.open(record.docsUrl, '_blank') },
    { key: 'monitor', label: '监控', icon: <MonitorOutlined />, onClick: (record: AiopcTool) => message.info(`监控面板: ${record.toolName}`) },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold m-0 flex items-center gap-3"><ThunderboltOutlined style={{ color: '#F0B90B' }} /> AIOPC超级合子工具箱</h1>
            <p className="text-gray-500 text-sm mt-2">中萨核心技术引擎 · 量子增强计算/超级因果推理/多模态融合 · ZS Exchange AIOPC v3.0</p>
          </div>
          <Space><Button icon={<ReloadOutlined />} onClick={() => message.success('刷新')}>刷新</Button><Button type="primary" icon={<PlusOutlined />}>注册工具</Button></Space>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard title="工具总数" value={totalTools} icon={<ToolOutlined />} color="#1677FF" description="已注册服务" />
          <DataCard title="在线运行" value={onlineCount} icon={<CheckCircleOutlined />} color="#16A34A" suffix={`/${totalTools}`} description="正常服务" />
          <DataCard title="今日请求" value={`${(totalRequests / 1000).toFixed(0)}K`} icon={<ApiOutlined />} color="#7C3AED" description="API调用量" />
          <DataCard title="平均成功率" value={`${avgSuccessRate}%`} icon={<ThunderboltOutlined />} color="#F59E0B" description="服务稳定性" />
          <DataCard title="平均延迟" value={`${avgLatency}ms`} icon={<MonitorOutlined />} color="#F0B90B" description="响应效率" />
        </div>

        <Card size="small">
          <Space wrap>
            <Select placeholder="工具类别" style={{ width: 140 }} allowClear value={filterCategory || undefined} onChange={setFilterCategory}>
              <Option value="quantum_compute">量子计算</Option><Option value="causal_inference">因果推理</Option>
              <Option value="multimodal_fusion">多模态融合</Option><Option value="predictive_model">预测模型</Option><Option value="risk_engine">风险引擎</Option>
            </Select>
            <Select placeholder="状态" style={{ width: 110 }} allowClear value={filterStatus || undefined} onChange={setFilterStatus}>
              <Option value="online">在线</Option><Option value="degraded">降级</Option><Option value="maintenance">维护中</Option>
            </Select>
          </Space>
        </Card>

        <DataTable columns={columns as any} dataSource={filteredTools as any} rowKey="id" actions={actions} showSearch={false} showAdd={false} />

        <Modal title={<span>工具详情 - <span style={{ color: '#F0B90B' }}>{selectedTool?.toolName}</span></span>} open={detailModalOpen} onCancel={() => setDetailModalOpen(false)} footer={[<Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>, <Button key="test" type="primary" icon={<ExperimentOutlined />}>调用测试</Button>]} width={860}>
          {selectedTool && (
            <div className="space-y-6">
              <Divider orientation="left">工具信息</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="工具名称">{selectedTool.toolName}</Descriptions.Item>
                <Descriptions.Item label="工具ID"><code>{selectedTool.id}</code></Descriptions.Item>
                <Descriptions.Item label="类别"><Tag color={categoryConfig[selectedTool.toolCategory]?.color}>{categoryConfig[selectedTool.toolCategory]?.label}</Tag></Descriptions.Item>
                <Descriptions.Item label="状态"><Tag color={statusConfig[selectedTool.status]?.color} icon={statusConfig[selectedTool.status]?.icon}>{statusConfig[selectedTool.status]?.label}</Tag></Descriptions.Item>
                <Descriptions.Item label="版本"><Tag color="blue">{selectedTool.version}</Tag></Descriptions.Item>
                <Descriptions.Item label="最后更新">{dayjs(selectedTool.lastUpdated).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                <Descriptions.Item label="文档链接" span={2}><a href={selectedTool.docsUrl} target="_blank" rel="noopener noreferrer">{selectedTool.docsUrl}</a></Descriptions.Item>
                <Descriptions.Item label="描述" span={2}>{selectedTool.description}</Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">API规格</Divider>
              <Card size="small"><code className="text-sm bg-gray-900 text-green-400 p-4 rounded block overflow-x-auto">{'POST ' + selectedTool.apiEndpoint + '<br/>Content-Type: application/json<br/>Authorization: Bearer &lt;token&gt;<br/><br/>{ "params": {}, "options": {} }'}</code></Card>

              <Divider orientation="left">性能指标</Divider>
              <div className="grid grid-cols-4 gap-4">
                <Card size="small"><div className="text-xs text-gray-500">平均延迟</div><div className={`text-xl font-bold ${selectedTool.avgLatencyMs > 2000 ? 'text-red-600' : selectedTool.avgLatencyMs > 1000 ? 'text-orange-600' : 'text-green-600'}`}>{selectedTool.avgLatencyMs}ms</div></Card>
                <Card size="small"><div className="text-xs text-gray-500">成功率</div><div className="text-xl font-bold text-green-600">{selectedTool.successRate}%</div></Card>
                <Card size="small"><div className="text-xs text-gray-500">今日请求</div><div className="text-xl font-bold">{selectedTool.requestsToday.toLocaleString()}</div></Card>
                <Card size="small"><div className="text-xs text-gray-500">QPS峰值</div><div className="text-xl font-bold">{Math.round(selectedTool.requestsToday / 24 / 3600 * 10)}</div></Card>
              </div>

              <Divider orientation="left"><StarIcon style={{ color: '#F0B90B' }} /> AIOPC引擎状态</Divider>
              <Card size="small" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFDF5 100%)', borderColor: '#F0B90B' }}>
                <div className="mb-3"><span className="text-lg font-bold" style={{ color: '#F0B90B' }}>健康评分: {selectedTool.successRate >= 99 ? 95 : selectedTool.successRate >= 95 ? 82 : 68}/100</span></div>
                <Space direction="vertical" className="w-full" size="middle">
                  <div><div className="flex justify-between mb-1"><span className="text-sm">可用性</span><span className="text-sm font-semibold">{selectedTool.status === 'online' ? '99.9%' : selectedTool.status === 'degraded' ? '95.2%' : '维护中'}</span></div><Progress percent={selectedTool.status === 'online' ? 99.9 : selectedTool.status === 'degraded' ? 95.2 : 0} strokeColor="#1677FF" showInfo={false} size="small" /></div>
                  <div><div className="flex justify-between mb-1"><span className="text-sm">响应质量</span><span className="text-sm font-semibold">{selectedTool.successRate}%</span></div><Progress percent={Math.round(selectedTool.successRate)} strokeColor="#16A34A" showInfo={false} size="small" /></div>
                  <div><div className="flex justify-between mb-1"><span className="text-sm">资源利用率</span><span className="text-sm font-semibold">{Math.round(Math.random() * 30 + 50)}%</span></div><Progress percent={Math.round(Math.random() * 30 + 50)} strokeColor="#7C3AED" showInfo={false} size="small" /></div>
                </Space>
              </Card>

              <Divider orientation="left">调用日志</Divider>
              <Table size="small" pagination={false} dataSource={[
                { time: dayjs().format('HH:mm:ss'), latency: selectedTool.avgLatencyMs + Math.round(Math.random() * 200 - 100), status: 'success', user: 'system' },
                { time: dayjs().subtract(5, 'minute').format('HH:mm:ss'), latency: selectedTool.avgLatencyMs + Math.round(Math.random() * 300), status: 'success', user: 'api_user_001' },
                { time: dayjs().subtract(12, 'minute').format('HH:mm:ss'), latency: selectedTool.avgLatencyMs * 2, status: selectedTool.status === 'degraded' ? 'slow' : 'success', user: 'batch_job' },
              ]} columns={[{ title: '时间', dataIndex: 'time', key: 'time', width: 80 }, { title: '延迟(ms)', dataIndex: 'latency', key: 'latency' }, { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === 'success' ? 'green' : v === 'slow' ? 'orange' : 'red'}>{v}</Tag> }, { title: '调用者', dataIndex: 'user', key: 'user' }]} rowKey="time" />

              <Divider orientation="left">版本更新记录</Divider>
              <Table size="small" pagination={false} dataSource={[
                { version: selectedTool.version, date: dayjs(selectedTool.lastUpdated).format('YYYY-MM-DD'), changes: '当前版本，性能优化+10%', type: 'release' },
                { version: `v${parseFloat(selectedTool.version) - 0.1}`, date: dayjs(selectedTool.lastUpdated).subtract(14, 'day').format('YYYY-MM-DD'), changes: '修复已知问题，增加新API端点', type: 'patch' },
                { version: `v${parseFloat(selectedTool.version) - 1.0}`, date: dayjs(selectedTool.lastUpdated).subtract(60, 'day').format('YYYY-MM-DD'), changes: '重大架构升级，支持分布式部署', type: 'major' },
              ]} columns={[{ title: '版本', dataIndex: 'version', key: 'version' }, { title: '日期', dataIndex: 'date', key: 'date' }, { title: '更新内容', dataIndex: 'changes', key: 'changes' }, { title: '类型', dataIndex: 'type', key: 'type', render: (v: string) => <Tag color={v === 'major' ? 'red' : v === 'release' ? 'blue' : 'green'}>{v}</Tag> }]} rowKey="version" />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
