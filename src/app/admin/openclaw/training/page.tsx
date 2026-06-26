'use client';

import { useState } from 'react';
import {
  Row, Col, Card, Tag, Button, Space, Modal, Form, Input, Select, Descriptions, Statistic, Badge, Typography, Tooltip, message, Popconfirm, Progress, Alert, Divider, Timeline, Steps, Table,
} from 'antd';
import {
  ApiOutlined, PlusOutlined, PlayCircleOutlined, PauseCircleOutlined, EditOutlined, DeleteOutlined, EyeOutlined,
  RocketOutlined, ClockCircleOutlined, CheckCircleOutlined, SyncOutlined, StopOutlined, WarningOutlined,
  DatabaseOutlined, CloudServerOutlined, SettingOutlined, FileTextOutlined, ExperimentOutlined,
  ThunderboltOutlined, TeamOutlined, LineChartOutlined, SafetyCertificateOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

// 模拟训练任务数据
const mockTrainingTasks = [
  {
    id: 'TRAIN-001', name: 'SecurityGuard v4.3 微调', model: 'LLaMA-3-70B', dataset: 'security_alerts_v2', status: 'training',
    progress: 68, epochs: 10, currentEpoch: 7, gpuHours: 124.5, estimatedRemaining: '2h 15m',
    loss: 0.0234, accuracy: 94.2, startTime: '2024-06-08 06:30', gpuType: 'A100-80G × 4',
    description: '基于最新安全事件数据微调威胁检测模型，提升未知攻击识别能力',
  },
  {
    id: 'TRAIN-002', name: 'RiskEngine 量化训练', model: 'Qwen-72B-Chat', dataset: 'defi_risk_2024Q2', status: 'completed',
    progress: 100, epochs: 15, currentEpoch: 15, gpuHours: 286.2, estimatedRemaining: '-',
    loss: 0.0156, accuracy: 97.8, startTime: '2024-06-07 14:00', endTime: '2024-06-07 22:30', gpuType: 'H100-80G × 8',
    description: '使用Q2 DeFi协议数据重新训练风险评估模型，优化无常损失预测精度',
  },
  {
    id: 'TRAIN-003', name: 'NLP-CustomerService 多语言', model: 'GPT-4o-mini', dataset: 'multilingual_support', status: 'queued',
    progress: 0, epochs: 8, currentEpoch: 0, gpuHours: 0, estimatedRemaining: '~4h',
    loss: '-', accuracy: '-', startTime: '-', gpuType: 'A100-40G × 2',
    description: '扩展客服模型的多语言能力，新增日语、韩语、阿拉伯语支持',
  },
  {
    id: 'TRAIN-004', name: 'ContentModerator V3', model: 'Claude-3-Haiku', dataset: 'content_safety_2024', status: 'training',
    progress: 35, epochs: 12, currentEpoch: 4, gpuHours: 67.8, estimatedRemaining: '3h 45m',
    loss: 0.0312, accuracy: 91.5, startTime: '2024-06-08 03:00', gpuType: 'A100-80G × 2',
    description: '更新内容审核规则集，适配最新监管要求和平台政策变更',
  },
  {
    id: 'TRAIN-005', name: 'AnomalyDetector 实时版', model: 'Mistral-Large', dataset: 'chain_anomalies_may', status: 'failed',
    progress: 42, epochs: 20, currentEpoch: 8, gpuHours: 156.3, estimatedRemaining: '-',
    loss: 0.0456, accuracy: 86.3, startTime: '2024-06-06 10:00', failReason: 'GPU显存溢出(OOM)，需要减少batch_size或增加GPU数量', gpuType: 'A100-40G × 4',
    description: '训练实时交易异常检测模型，处理高频交易场景下的延迟要求',
  },
  {
    id: 'TRAIN-006', name: 'IdentityVerifier OCR增强', model: 'ViT-Large', dataset: 'id_documents_intl', status: 'completed',
    progress: 100, epochs: 6, currentEpoch: 6, gpuHours: 45.6, estimatedRemaining: '-',
    loss: 0.0089, accuracy: 98.9, startTime: '2024-06-05 09:00', endTime: '2024-06-05 14:20', gpuType: 'A100-40G × 2',
    description: '增强OCR模型的国际证件识别能力，支持50+国家/地区的身份证件格式',
  },
  {
    id: 'TRAIN-007', name: 'TradingStrategy RL微调', model: 'DeepSeek-V2', dataset: 'trading_history_2y', status: 'paused',
    progress: 55, epochs: 30, currentEpoch: 17, gpuHours: 320.1, estimatedRemaining: '~6h',
    loss: 0.0278, accuracy: 89.7, startTime: '2024-06-04 20:00', gpuType: 'H100-80G × 8',
    description: '使用强化学习微调交易策略模型，优化止盈止损决策逻辑',
  },
  {
    id: 'TRAIN-008', name: 'KnowledgeBase RAG训练', model: 'BGE-large-zh', dataset: 'internal_docs_v3', status: 'completed',
    progress: 100, epochs: 5, currentEpoch: 5, gpuHours: 12.3, estimatedRemaining: '-',
    loss: 0.112, accuracy: 92.4, startTime: '2024-06-03 16:00', endTime: '2024-06-03 18:30', gpuType: 'A100-40G × 1',
    description: '更新内部知识库的向量索引，提升RAG检索准确率',
  },
];

// 状态映射
const statusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  training: { color: 'blue', text: '训练中', icon: <SyncOutlined spin /> },
  completed: { color: 'green', text: '已完成', icon: <CheckCircleOutlined /> },
  failed: { color: 'red', text: '失败', icon: <WarningOutlined /> },
  queued: { color: 'orange', text: '排队中', icon: <ClockCircleOutlined /> },
  paused: { color: 'default', text: '已暂停', icon: <PauseCircleOutlined /> },
};

export default function TrainingPage() {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  // 统计数据
  const totalTasks = mockTrainingTasks.length;
  const inProgress = mockTrainingTasks.filter(t => t.status === 'training').length;
  const completed = mockTrainingTasks.filter(t => t.status === 'completed').length;
  const avgEpochs = (mockTrainingTasks.reduce((sum, t) => sum + t.epochs, 0) / totalTasks).toFixed(1);
  const totalGpuHours = mockTrainingTasks.reduce((sum, t) => sum + t.gpuHours, 0).toFixed(1);

  const columns = [
    {
      title: '训练任务',
      key: 'task',
      width: 260,
      render: (_: any, record: any) => (
        <div className="flex items-center gap-3">
          <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
            record.status === 'training' ? 'bg-blue-100 text-blue-600' :
            record.status === 'completed' ? 'bg-green-100 text-green-600' :
            record.status === 'failed' ? 'bg-red-100 text-red-600' :
            'bg-orange-100 text-orange-600'
          }`}>
            <RocketOutlined style={{ fontSize: 20 }} />
          </div>
          <div>
            <div className="font-semibold text-base">{record.name}</div>
            <div className="text-xs text-gray-400">{record.model}</div>
          </div>
        </div>
      ),
    },
    {
      title: '数据集',
      dataIndex: 'dataset',
      key: 'dataset',
      width: 180,
      render: (ds: string) => <Text code className="!text-xs">{ds}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const cfg = statusConfig[status];
        return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag> : status;
      },
    },
    {
      title: '训练进度',
      key: 'progress',
      width: 180,
      render: (_: any, record: any) => (
        <div>
          <Progress
            percent={record.progress}
            size="small"
            status={record.status === 'failed' ? 'exception' : record.status === 'completed' ? 'success' : 'active'}
            strokeColor={record.progress >= 90 ? '#16A34A' : record.progress >= 50 ? '#1677FF' : '#F59E0B'}
            format={percent => `${percent}% (${record.currentEpoch}/${record.epochs} epochs)`}
          />
        </div>
      ),
    },
    {
      title: '准确率',
      dataIndex: 'accuracy',
      key: 'accuracy',
      width: 90,
      align: 'right' as const,
      render: (acc: number | string) => acc !== '-' ? (
        <span className={typeof acc === 'number' && acc >= 95 ? 'text-green-600 font-semibold' : typeof acc === 'number' && acc >= 90 ? 'text-orange-500' : 'text-red-500'}>
          {acc}%
        </span>
      ) : <span className="text-gray-400">-</span>,
    },
    {
      title: 'GPU用时',
      dataIndex: 'gpuHours',
      key: 'gpuHours',
      width: 100,
      align: 'right',
      render: (hours: number) => `${hours.toFixed(1)}h`,
    },
    {
      title: 'GPU类型',
      dataIndex: 'gpuType',
      key: 'gpuType',
      width: 140,
      render: (type: string) => <Tag color="purple">{type}</Tag>,
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_: any, record: any) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedTask(record); setDetailModalVisible(true); }} />
          </Tooltip>
          {record.status === 'training' && (
            <Popconfirm title="确定暂停训练？" onConfirm={() => message.success('训练已暂停')}>
              <Button type="text" size="small" icon={<PauseCircleOutlined />} className="text-orange-500" />
            </Popconfirm>
          )}
          {(record.status === 'queued' || record.status === 'paused') && (
            <Popconfirm title="确定启动训练？" onConfirm={() => message.success('训练已启动')}>
              <Button type="text" size="small" icon={<PlayCircleOutlined />} className="text-green-500" />
            </Popconfirm>
          )}
          {record.status === 'failed' && (
            <Popconfirm title="重新提交训练任务？" onConfirm={() => message.success('任务已重新提交')}>
              <Button type="text" size="small" icon={<RocketOutlined />} className="text-blue-500">重试</Button>
            </Popconfirm>
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
            <ExperimentOutlined className="text-2xl text-violet-600" />
            <h1 className="text-2xl font-bold m-0">训练微调</h1>
          </div>
          <Space>
            <Button icon={<CloudServerOutlined />}>GPU资源</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateModalVisible(true)}>新建训练任务</Button>
          </Space>
        </div>

        {/* 数据卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="训练任务"
              value={totalTasks}
              icon={<RocketOutlined />}
              color="#7C3AED"
              description="全部历史任务"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="进行中"
              value={inProgress}
              icon={<SyncOutlined />}
              color="#1677FF"
              trend={inProgress > 0 ? 'up' : 'none'}
              trendValue={inProgress > 0 ? `${inProgress}个正在训练` : undefined}
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="已完成"
              value={completed}
              icon={<CheckCircleOutlined />}
              color="#16A34A"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="平均 Epochs"
              value={avgEpochs}
              icon={<LineChartOutlined />}
              color="#F59E0B"
            />
          </Col>
          <Col xs={24} sm={12} md={6}>
            <DataCard
              title="GPU总用时"
              value={`${totalGpuHours}h`}
              icon={<CloudServerOutlined />}
              color="#DC2626"
            />
          </Col>
        </Row>

        {/* 训练任务列表 */}
        <DataTable
          columns={columns as any}
          dataSource={mockTrainingTasks}
          rowKey="id"
          title="训练任务列表"
          showSearch
          searchPlaceholder="搜索任务名称、模型或数据集..."
          showFilter
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '训练中', value: 'training' },
            { label: '已完成', value: 'completed' },
            { label: '失败', value: 'failed' },
            { label: '排队中', value: 'queued' },
            { label: '已暂停', value: 'paused' },
          ]}
          pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 个任务` }}
        />

        {/* GPU资源概览 */}
        <Card title={<span><CloudServerOutlined /> GPU 资源池状态</span>} className="shadow-sm">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={6}>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">4/12</div>
                <div className="text-sm text-gray-500 mt-1">A100-80G 使用中</div>
                <Progress percent={33} size="small" strokeColor="#1677FF" className="mt-2" />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">2/8</div>
                <div className="text-sm text-gray-500 mt-1">H100-80G 使用中</div>
                <Progress percent={25} size="small" strokeColor="#16A34A" className="mt-2" />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">2/6</div>
                <div className="text-sm text-gray-500 mt-1">A100-40G 使用中</div>
                <Progress percent={33} size="small" strokeColor="#F59E0B" className="mt-2" />
              </div>
            </Col>
            <Col xs={24} sm={12} md={6}>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">8台</div>
                <div className="text-sm text-gray-500 mt-1">空闲可用</div>
                <Button type="primary" size="small" ghost className="mt-2">申请更多</Button>
              </div>
            </Col>
          </Row>
        </Card>

        {/* 详情弹窗 */}
        <Modal
          title={`训练详情 - ${selectedTask?.name}`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={750}
          footer={[
            <Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>,
            selectedTask?.status === 'training' && <Button key="pause" icon={<PauseCircleOutlined />}>暂停训练</Button>,
            selectedTask?.status === 'failed' && <Button key="retry" type="primary" icon={<RocketOutlined />} onClick={() => message.success('任务已重新提交')}>重新训练</Button>,
          ].filter(Boolean)}
        >
          {selectedTask && (
            <div className="space-y-4">
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="任务ID"><Text code>{selectedTask.id}</Text></Descriptions.Item>
                <Descriptions.Item label="状态">{(() => { const cfg = statusConfig[selectedTask.status]; return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag> : selectedTask.status; })()}</Descriptions.Item>
                <Descriptions.Item label="基础模型" span={2}><Tag color="blue">{selectedTask.model}</Tag></Descriptions.Item>
                <Descriptions.Item label="训练数据集" span={2}><Text code>{selectedTask.dataset}</Text></Descriptions.Item>
                <Descriptions.Item label="GPU配置" span={2}><Tag color="purple">{selectedTask.gpuType}</Tag></Descriptions.Item>
                <Descriptions.Item label="总Epochs">{selectedTask.epochs}</Descriptions.Item>
                <Descriptions.Item label="当前Epoch">{selectedTask.currentEpoch}</Descriptions.Item>
                <Descriptions.Item label="训练进度" span={2}>
                  <Progress percent={selectedTask.progress} status={selectedTask.status === 'failed' ? 'exception' : 'active'} />
                </Descriptions.Item>
                <Descriptions.Item label="Loss值"><Text type={parseFloat(selectedTask.loss as string) > 0.03 ? 'danger' : 'success'}>{selectedTask.loss}</Text></Descriptions.Item>
                <Descriptions.Item label="准确率"><Text strong className={selectedTask.accuracy >= 95 ? 'text-green-600' : 'text-orange-500'}>{selectedTask.accuracy}%</Text></Descriptions.Item>
                <Descriptions.Item label="GPU用时">{selectedTask.gpuHours.toFixed(1)} 小时</Descriptions.Item>
                <Descriptions.Item label="预计剩余">{selectedTask.estimatedRemaining}</Descriptions.Item>
                <Descriptions.Item label="开始时间">{selectedTask.startTime}</Descriptions.Item>
                {selectedTask.endTime && <Descriptions.Item label="完成时间">{selectedTask.endTime}</Descriptions.Item>}
              </Descriptions>

              {selectedTask.failReason && (
                <Alert type="error" showIcon message="失败原因" description={selectedTask.failReason} />
              )}

              <Divider orientation="left">任务描述</Divider>
              <Paragraph className="bg-gray-50 p-4 rounded-lg mb-0">{selectedTask.description}</Paragraph>
            </div>
          )}
        </Modal>

        {/* 新建训练任务弹窗 */}
        <Modal
          title="新建训练任务"
          open={createModalVisible}
          onCancel={() => setCreateModalVisible(false)}
          width={700}
          okText="提交任务"
          onOk={() => { message.success('训练任务已提交到队列'); setCreateModalVisible(false); }}
        >
          <Alert type="info" showIcon className="mb-4" message="训练须知" description="请确保数据集已上传至对象存储，并选择合适的GPU资源配置以避免OOM错误。" />
          <Form layout="vertical" className="mt-4">
            <Form.Item label="任务名称" rules={[{ required: true }]}>
              <Input placeholder="例如：SecurityGuard v4.3 微调" prefix={<RocketOutlined />} />
            </Form.Item>
            <Row gutter={16}>
              <Col span={12}>
                <Form.Item label="基础模型" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { label: 'LLaMA-3-70B', value: 'llama3-70b' },
                      { label: 'Qwen-72B-Chat', value: 'qwen-72b' },
                      { label: 'GPT-4o-mini', value: 'gpt-4o-mini' },
                      { label: 'Claude-3-Haiku', value: 'claude-3-haiku' },
                      { label: 'Mistral-Large', value: 'mistral-large' },
                    ]}
                    placeholder="选择基础模型"
                  />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item label="训练数据集" rules={[{ required: true }]}>
                  <Select
                    options={[
                      { label: 'security_alerts_v2', value: 'security_v2' },
                      { label: 'defi_risk_2024Q2', value: 'defi_risk' },
                      { label: 'multilingual_support', value: 'multilingual' },
                      { label: 'content_safety_2024', value: 'content_safety' },
                    ]}
                    placeholder="选择数据集"
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Form.Item label="训练轮数(Epochs)">
                  <Input type="number" min={1} max={100} defaultValue={10} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="Batch Size">
                  <Input type="number" min={1} max={512} defaultValue={32} />
                </Form.Item>
              </Col>
              <Col span={8}>
                <Form.Item label="学习率">
                  <Input type="number" step="0.000001" min={0} max={1} defaultValue={0.0001} />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item label="GPU配置" rules={[{ required: true }]}>
              <Select
                options={[
                  { label: 'A100-40G × 1 (入门)', value: 'a100-40g-1' },
                  { label: 'A100-40G × 2 (标准)', value: 'a100-40g-2' },
                  { label: 'A100-80G × 4 (推荐)', value: 'a100-80g-4' },
                  { label: 'H100-80G × 8 (高性能)', value: 'h100-80g-8' },
                ]}
                placeholder="选择GPU配置"
              />
            </Form.Item>
            <Form.Item label="任务描述">
              <Input.TextArea rows={3} placeholder="描述本次训练的目标和预期效果..." />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
}
