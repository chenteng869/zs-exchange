'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Tag, Badge, Button, Space, Row, Col, Typography, Divider, Progress, Statistic, Alert, Tooltip, Modal, message,
} from 'antd';
import {
  CloudServerOutlined, DashboardOutlined, ThunderboltOutlined, ApiOutlined, HddOutlined,
  EyeOutlined, SettingOutlined, PlayCircleOutlined, PauseCircleOutlined, ReloadOutlined,
  ExperimentOutlined, RocketOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

// Mock数据 - 模型列表
const mockModels = [
  { id: 'MD-001', name: 'RiskPredict-LSTM', version: 'v3.2.1', type: '深度学习', accuracy: 94.2, latency: 45, qps: 1200, status: 'online', gpuUsage: 72, lastUpdate: '2024-06-23 02:00' },
  { id: 'MD-002', name: 'FraudDetect-XGB', version: 'v2.8.5', type: '集成学习', accuracy: 96.8, latency: 12, qps: 8500, status: 'online', gpuUsage: 35, lastUpdate: '2024-06-22 18:30' },
  { id: 'MD-003', name: 'Sentiment-BERT', version: 'v1.5.2', type: 'NLP', accuracy: 89.5, latency: 88, qps: 450, status: 'online', gpuUsage: 88, lastUpdate: '2024-06-23 01:15' },
  { id: 'MD-004', name: 'PriceForecast-Prophet', version: 'v2.1.0', type: '时序预测', accuracy: 91.3, latency: 25, qps: 3200, status: 'training', gpuUsage: 95, lastUpdate: '2024-06-22 22:00' },
  { id: 'MD-005', name: 'AnomalyDetector-IF', version: 'v1.9.3', type: '无监督学习', accuracy: 87.6, latency: 8, qps: 15000, status: 'online', gpuUsage: 22, lastUpdate: '2024-06-21 14:20' },
  { id: 'MD-006', name: 'Recommend-CF', version: 'v3.0.1', type: '推荐系统', accuracy: 82.4, latency: 156, qps: 280, status: 'offline', gpuUsage: 0, lastUpdate: '2024-06-18 09:00' },
  { id: 'MD-007', name: 'KGEstimator-GNN', version: 'v1.2.0', type: '图神经网络', accuracy: 78.9, latency: 210, qps: 120, status: 'online', gpuUsage: 65, lastUpdate: '2024-06-20 16:45' },
  { id: 'MD-008', name: 'CreditScore-LR', version: 'v4.1.2', type: '传统ML', accuracy: 93.1, latency: 3, qps: 25000, status: 'online', gpuUsage: 5, lastUpdate: '2024-06-22 08:30' },
  { id: 'MD-009', name: 'ImageClassify-CNN', version: 'v2.3.0', type: '计算机视觉', accuracy: 91.8, latency: 65, qps: 800, status: 'training', gpuUsage: 98, lastUpdate: '2024-06-23 00:00' },
  { id: 'MD-010', name: 'SeqLabel-CRF', version: 'v1.8.1', type: 'NLP', accuracy: 86.2, latency: 42, qps: 1500, status: 'online', gpuUsage: 48, lastUpdate: '2024-06-21 11:30' },
];

export default function ModelManagementPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  const { data: models, isLoading } = useQuery({
    queryKey: ['ai-models'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 500));
      return mockModels;
    },
  });

  // 模型状态Badge
  const getStatusBadge = (status: string) => {
    const map: Record<string, { status: string; text: string; icon: React.ReactNode }> = {
      online: { status: 'success', text: '在线运行', icon: <PlayCircleOutlined /> },
      training: { status: 'processing', text: '训练中', icon: <ReloadOutlined spin /> },
      offline: { status: 'default', text: '已下线', icon: <PauseCircleOutlined /> },
      error: { status: 'error', text: '异常', icon: '' },
    };
    const item = map[status] || map.offline;
    return <Badge status={item.status as any} text={<Space size={4}>{item.icon}{item.text}</Space>} />;
  };

  // 精度颜色条
  const getAccuracyColor = (acc: number) => {
    if (acc >= 95) return '#16A34A';
    if (acc >= 90) return '#1677FF';
    if (acc >= 85) return '#F59E0B';
    return '#DC2626';
  };

  // 类型Tag颜色
  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      '深度学习': 'purple',
      '集成学习': 'green',
      'NLP': 'blue',
      '时序预测': 'orange',
      '无监督学习': 'cyan',
      '推荐系统': 'magenta',
      '图神经网络': 'geekblue',
      '传统ML': 'gold',
      '计算机视觉': 'volcano',
    };
    return colors[type] || 'default';
  };

  const columns = [
    {
      title: '模型名称',
      key: 'name',
      width: 220,
      render: (_: any, record: any) => (
        <Space>
          <CloudServerOutlined className={record.status === 'online' ? 'text-green-500' : record.status === 'training' ? 'text-blue-500 animate-pulse' : 'text-gray-400'} />
          <div>
            <Text strong>{record.name}</Text>
            <br /><Text type="secondary" className="text-xs">{record.version}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 120,
      render: (type: string) => <Tag color={getTypeColor(type)}>{type}</Tag>,
    },
    {
      title: '精度',
      dataIndex: 'accuracy',
      key: 'accuracy',
      width: 130,
      render: (val: number) => (
        <Progress
          percent={val}
          size="small"
          strokeColor={getAccuracyColor(val)}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: '延迟(ms)',
      dataIndex: 'latency',
      key: 'latency',
      width: 100,
      render: (val: number) => (
        <Text style={{ color: val <= 20 ? '#16A34A' : val <= 80 ? '#F59E0B' : '#DC2626' }} strong>{val}</Text>
      ),
    },
    {
      title: 'QPS',
      dataIndex: 'qps',
      key: 'qps',
      width: 100,
      render: (val: number) => <Text code>{val.toLocaleString()}</Text>,
    },
    {
      title: 'GPU使用率',
      dataIndex: 'gpuUsage',
      key: 'gpuUsage',
      width: 120,
      render: (val: number) => (
        <Progress
          percent={val}
          size="small"
          strokeColor={val >= 90 ? '#DC2626' : val >= 70 ? '#F59E0B' : '#16A34A'}
          format={(percent) => `${percent}%`}
        />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (status: string) => getStatusBadge(status),
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      onClick: (record: any) => {
        setSelectedModel(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'config',
      label: '配置',
      icon: <SettingOutlined />,
      hidden: (record: any) => record.status === 'offline',
      onClick: (record: any) => {
        message.info(`打开 ${record.name} 的配置面板`);
      },
    },
  ];

  // 统计数据
  const onlineCount = models?.filter((m: any) => m.status === 'online').length || 0;
  const avgLatency = models ? (models.reduce((sum: number, m: any) => sum + m.latency, 0) / models.length).toFixed(1) : 0;
  const totalQPS = models?.reduce((sum: number, m: any) => sum + m.qps, 0) || 0;
  const avgGpu = models ? (models.reduce((sum: number, m: any) => sum + m.gpuUsage, 0) / models.length).toFixed(1) : 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CloudServerOutlined className="text-3xl text-blue-500" />
            <div>
              <Title level={3} className="!mb-0">AI 模型管理中心</Title>
              <Text type="secondary">版本管理 · 性能监控 · A/B 测试</Text>
            </div>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />}>刷新状态</Button>
            <Button type="primary" icon={<ExperimentOutlined />}>部署新模型</Button>
          </Space>
        </div>

        {/* DataCards - 5个 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="在线模型数"
              value={onlineCount}
              icon={<DashboardOutlined />}
              color="#16A34A"
              suffix={`/${models?.length || 0}`}
              description="当前运行中的模型"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="总模型数"
              value={models?.length || 0}
              icon={<ApiOutlined />}
              color="#1677FF"
              suffix="个"
              description="已注册的全部模型"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="平均推理延迟"
              value={avgLatency}
              icon={<ThunderboltOutlined />}
              color="#F59E0B"
              suffix="ms"
              description="P99延迟指标"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="总QPS"
              value={(totalQPS / 1000).toFixed(1)}
              icon={<RocketOutlined />}
              color="#7C3AED"
              suffix="K"
              description="所有模型并发能力"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="GPU利用率"
              value={avgGpu}
              icon={<HddOutlined />}
              color="#06B6D4"
              suffix="%"
              description="集群平均负载"
            />
          </Col>
        </Row>

        {/* DataTable - 模型列表 */}
        <Card title="模型列表" className="shadow-sm" extra={
          <Space>
            <Badge count={onlineCount} style={{ backgroundColor: '#16A34A' }}>
              <Tag color="green">在线</Tag>
            </Badge>
            <Badge count={models?.filter((m: any) => m.status === 'training').length || 0} style={{ backgroundColor: '#1677FF' }}>
              <Tag color="blue">训练中</Tag>
            </Badge>
            <Tag color="default">共 {models?.length || 0} 个</Tag>
          </Space>
        }>
          <DataTable
            columns={columns}
            dataSource={models || []}
            loading={isLoading}
            actions={actions}
            rowKey="id"
            showSearch
            searchPlaceholder="搜索模型名称或类型"
            showFilter
            filterOptions={[
              { label: '全部状态', value: '' },
              { label: '在线运行', value: 'online' },
              { label: '训练中', value: 'training' },
              { label: '已下线', value: 'offline' },
            ]}
            pagination={{
              pageSize: 8,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个模型`,
            }}
          />
        </Card>

        {/* 业务特性说明区域 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <Card title={<Space><SafetyCertificateOutlined /><span>性能指标概览</span></Space>} className="shadow-sm">
              <div className="space-y-4">
                <Row gutter={[16, 16]}>
                  <Col span={8}>
                    <Statistic title="平均精度" value={models ? (models.reduce((s: number, m: any) => s + m.accuracy, 0) / models.length).toFixed(1) : 0} suffix="%" valueStyle={{ color: '#16A34A', fontSize: 18 }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="最高QPS" value={Math.max(...(models?.map((m: any) => m.qps) || [0]))} valueStyle={{ color: '#1677FF', fontSize: 18 }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="最低延迟" value={Math.min(...(models?.map((m: any) => m.latency) || [999]))} suffix="ms" valueStyle={{ color: '#7C3AED', fontSize: 18 }} />
                  </Col>
                </Row>
                <Divider />
                <div>
                  <Text strong>GPU资源分布：</Text>
                  <div className="mt-2 flex gap-1 h-8 items-end">
                    {models?.slice(0, 8).map((m: any) => (
                      <Tooltip key={m.id} title={`${m.name}: ${m.gpuUsage}%`}>
                        <div
                          className="flex-1 rounded-t transition-all cursor-pointer hover:opacity-80"
                          style={{
                            height: `${m.gpuUsage}%`,
                            backgroundColor: m.gpuUsage >= 90 ? '#DC2626' : m.gpuUsage >= 70 ? '#F59E0B' : '#16A34A',
                            minHeight: 8,
                          }}
                        />
                      </Tooltip>
                    ))}
                  </div>
                </div>
                <Alert
                  type="info"
                  showIcon
                  message="集群状态健康"
                  description={
                    <Space>
                      <Badge status="success" text={`${onlineCount} 个模型正常运行`} />
                      <Badge status="processing" text="GPU集群温度正常" />
                      <Badge status="warning" text="建议关注高负载模型" />
                    </Space>
                  }
                />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Space><SettingOutlined /><span>管理能力说明</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                <Alert
                  type="warning"
                  showIcon
                  banner
                  message="模型生命周期管理"
                  description="支持模型的注册、版本控制、灰度发布、回滚、下线全流程管理"
                />
                <Divider />
                <div className="bg-gray-50 rounded-lg p-4">
                  <Text strong>核心功能：</Text>
                  <ul className="mt-2 space-y-2 text-sm text-gray-600 ml-4">
                    <li><CloudServerOutlined className="mr-2 text-blue-500" /> 版本管理：支持多版本并存、快速切换与回滚</li>
                    <li><ThunderboltOutlined className="mr-2 text-green-500" /> 性能监控：实时追踪延迟、QPS、GPU/内存占用</li>
                    <li><ExperimentOutlined className="mr-2 text-orange-500" /> A/B测试：支持流量分流与效果对比分析</li>
                    <li><SafetyCertificateOutlined className="mr-2 text-purple-500" /> 自动扩缩容：基于QPS阈值自动调整实例数</li>
                    <li><ReloadOutlined className="mr-2 text-red-500" /> 热更新：支持不停服的模型参数热加载</li>
                  </ul>
                </div>
                <div className="bg-blue-50 rounded-lg p-3 mt-3">
                  <Text type="secondary" className="text-sm">
                    <PlayCircleOutlined className="mr-1 text-blue-500" />
                    支持 TensorFlow/PyTorch/ONNX | 容器化部署 | Kubernetes编排
                  </Text>
                </div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 详情弹窗 */}
        <Modal
          title={`模型详情 - ${selectedModel?.name || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
            <Button key="retrain" type="primary" icon={<ExperimentOutlined />} onClick={() => {
              message.success('已提交重训练任务');
              setDetailModalOpen(false);
            }}>重新训练</Button>,
          ]}
          width={700}
        >
          {selectedModel && (
            <div className="space-y-4 mt-4">
              <Row gutter={[16, 16]}>
                <Col span={8}><Statistic title="模型名称" value={selectedModel.name} /></Col>
                <Col span={8}><Statistic title="版本" value={selectedModel.version} /></Col>
                <Col span={8}><Statistic title="类型" value="" prefix={<Tag color={getTypeColor(selectedModel.type)}>{selectedModel.type}</Tag>} /></Col>
                <Col span={8}><Statistic title="精度" value={selectedModel.accuracy} suffix="%" valueStyle={{ color: getAccuracyColor(selectedModel.accuracy) }} /></Col>
                <Col span={8}><Statistic title="延迟" value={selectedModel.latency} suffix="ms" /></Col>
                <Col span={8}><Statistic title="QPS" value={selectedModel.qps} /></Col>
                <Col span={8}><Statistic title="GPU使用率" value={selectedModel.gpuUsage} suffix="%" /></Col>
                <Col span={8}><Statistic title="状态" value="" prefix={getStatusBadge(selectedModel.status)} /></Col>
                <Col span={8}><Statistic title="最后更新" value={selectedModel.lastUpdate} /></Col>
              </Row>
              <Divider />
              <div>
                <Text strong>性能指标：</Text>
                <div className="grid grid-cols-2 gap-4 mt-2">
                  <div><Text type="secondary">精度</Text><Progress percent={selectedModel.accuracy} strokeColor={getAccuracyColor(selectedModel.accuracy)} /></div>
                  <div><Text type="secondary">GPU使用率</Text><Progress percent={selectedModel.gpuUsage} strokeColor={selectedModel.gpuUsage >= 90 ? '#DC2626' : '#1677FF'} /></div>
                </div>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
