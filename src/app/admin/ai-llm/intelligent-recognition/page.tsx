'use client';

import { useState } from 'react';
import {
  Row, Col, Card, Tag, Button, Space, Modal, Descriptions, Statistic, Badge, Typography, Tooltip, message, Progress, Alert, Divider,
} from 'antd';
import {
  EyeOutlined, ScanOutlined, FileTextOutlined, AudioOutlined, PictureOutlined, ThunderboltOutlined,
  CheckCircleOutlined, ClockCircleOutlined, WarningOutlined, SyncOutlined,
  RobotOutlined, ApiOutlined, SettingOutlined, PlusOutlined, SafetyCertificateOutlined,
  LineChartOutlined, ExperimentOutlined, TranslationOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

// 模拟识别任务数据
const mockTasks = [
  {
    id: 'REC-001', name: 'KYC身份证OCR识别', type: 'ocr', inputFormat: 'Image/PDF', outputFormat: 'JSON',
    accuracy: 98.9, avgLatency: 320, concurrency: 50, todayRequests: 12580, status: 'running',
    description: '支持50+国家/地区身份证件的OCR识别，含人脸比对验证',
    model: 'ViT-Large + OCR-Engine v3.0',
  },
  {
    id: 'REC-002', name: '智能客服意图分类', type: 'nlp', inputFormat: 'Text', outputFormat: 'Label+Confidence',
    accuracy: 96.2, avgLatency: 45, concurrency: 200, todayRequests: 45620, status: 'running',
    description: '基于BERT的多分类意图识别，支持120+种用户意图类别',
    model: 'IntentClassifier-BERT-v2.1',
  },
  {
    id: 'REC-003', name: 'NFT内容审核', type: 'image', inputFormat: 'Image', outputFormat: 'SafetyReport',
    accuracy: 94.5, avgLatency: 580, concurrency: 30, todayRequests: 8930, status: 'running',
    description: 'AI驱动的NFT内容安全审核，检测违规、侵权、敏感内容',
    model: 'ContentModerator-CNN-v3.2',
  },
  {
    id: 'REC-004', name: '语音转文字(ASR)', type: 'speech', inputFormat: 'Audio/WAV', outputFormat: 'Text+SRT',
    accuracy: 95.8, avgLatency: 1500, concurrency: 20, todayRequests: 3450, status: 'running',
    description: '实时语音转文字服务，支持中英日韩等8种语言',
    model: 'Whisper-Large-v3',
  },
  {
    id: 'REC-005', name: '合同条款抽取(NER)', type: 'nlp', inputFormat: 'Text/PDF', outputFormat: 'StructuredJSON',
    accuracy: 92.3, avgLatency: 280, concurrency: 40, todayRequests: 2180, status: 'running',
    description: '从法律合同中自动提取关键条款和实体信息',
    model: 'LegalNER-RoBERTa-v1.5',
  },
  {
    id: 'REC-006', name: '交易截图异常检测', type: 'vision', inputFormat: 'Image', outputFormat: 'AnomalyReport',
    accuracy: 91.2, avgLatency: 420, concurrency: 25, todayRequests: 15670, status: 'warning',
    description: '检测交易截图中的PS篡改、金额伪造等欺诈行为',
    model: 'FraudDetector-ViT-v2.0',
  },
  {
    id: 'REC-007', name: '多语言情感分析', type: 'nlp', inputFormat: 'Text', outputFormat: 'SentimentScore',
    accuracy: 93.7, avgLatency: 65, concurrency: 150, todayRequests: 28900, status: 'running',
    description: '支持25+语言的细粒度情感分析和观点挖掘',
    model: 'Sentiment-XLM-R-v2.0',
  },
  {
    id: 'REC-008', name: '手写签名验证', type: 'biometric', inputFormat: 'Image', outputFormat: 'VerificationResult',
    accuracy: 89.5, avgLatency: 380, concurrency: 15, todayRequests: 890, status: 'degraded',
    description: '在线手写签名的动态特征验证，用于电子签约场景',
    model: 'SignatureNet-LSTM-v1.2',
  },
  {
    id: 'REC-009', name: 'PDF表格结构化提取', type: 'ocr', inputFormat: 'PDF', outputFormat: 'Excel/CSV',
    accuracy: 97.1, avgLatency: 850, concurrency: 20, todayRequests: 4560, status: 'running',
    description: '复杂PDF表格的智能识别与结构化提取，保留格式信息',
    model: 'TableExtractor-LayoutLMv3',
  },
  {
    id: 'REC-010', name: '实时语音情绪识别', type: 'speech', inputFormat: 'AudioStream', outputFormat: 'EmotionLabel',
    accuracy: 87.3, avgLatency: 95, concurrency: 60, todayRequests: 12340, status: 'running',
    description: '从通话音频流中实时识别用户情绪状态，用于客服质检',
    model: 'EmotionVoice-Wav2Vec2',
  },
];

// 识别类型配置
const recTypeConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  ocr: { color: 'red', label: 'OCR文字识别', icon: <ScanOutlined /> },
  nlp: { color: 'blue', label: 'NLP自然语言', icon: <FileTextOutlined /> },
  image: { color: 'purple', label: '图像识别', icon: <PictureOutlined /> },
  speech: { color: 'green', label: '语音处理', icon: <AudioOutlined /> },
  vision: { color: 'orange', label: '视觉分析', icon: <EyeOutlined /> },
  biometric: { color: 'cyan', label: '生物特征', icon: <SafetyCertificateOutlined /> },
};

// 状态配置
const recStatusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  running: { color: 'green', text: '运行中', icon: <SyncOutlined spin /> },
  warning: { color: 'orange', text: '警告', icon: <WarningOutlined /> },
  degraded: { color: 'red', text: '降级', icon: <WarningOutlined /> },
  stopped: { color: 'default', text: '已停止', icon: <PauseCircleOutlined /> },
};

export default function IntelligentRecognitionPage() {
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);

  // 统计数据
  const todayRequests = mockTasks.reduce((sum, t) => sum + t.todayRequests, 0);
  const avgAccuracy = (mockTasks.reduce((sum, t) => sum + t.accuracy, 0) / mockTasks.length).toFixed(1);
  const avgLatency = Math.round(mockTasks.reduce((sum, t) => sum + t.avgLatency, 0) / mockTasks.length);
  const supportedFormats = new Set(mockTasks.map(t => t.inputFormat)).size;
  const maxConcurrency = Math.max(...mockTasks.map(t => t.concurrency));

  const columns = [
    {
      title: '识别任务',
      key: 'task',
      width: 260,
      render: (_: any, record: any) => {
        const typeCfg = recTypeConfig[record.type];
        return (
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${typeCfg?.color || '#666'}15`, color: typeCfg?.color || '#666' }}>
              {typeCfg?.icon || <ExperimentOutlined />}
            </div>
            <div><div className="font-semibold text-sm">{record.name}</div><div className="text-xs text-gray-400">{record.model}</div></div>
          </div>
        );
      },
    },
    {
      title: '识别类型',
      dataIndex: 'type',
      key: 'type',
      width: 130,
      render: (type: string) => {
        const cfg = recTypeConfig[type];
        return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{cfg.label}</Tag> : type;
      },
    },
    {
      title: '准确率',
      dataIndex: 'accuracy',
      key: 'accuracy',
      width: 100,
      align: 'right',
      render: (acc: number) => (
        <span className={
          acc >= 96 ? 'text-green-600 font-bold' :
          acc >= 92 ? 'text-blue-600 font-semibold' :
          acc >= 88 ? 'text-orange-500' : 'text-red-500'
        }>{acc}%</span>
      ),
    },
    {
      title: '平均延迟(ms)',
      dataIndex: 'avgLatency',
      key: 'avgLatency',
      width: 120,
      align: 'right',
      render: (lat: number) => (
        <span className={lat < 200 ? 'text-green-600' : lat < 800 ? 'text-orange-500' : 'text-red-500'}>{lat}ms</span>
      ),
    },
    {
      title: '并发能力',
      dataIndex: 'concurrency',
      key: 'concurrency',
      width: 90,
      align: 'center',
      render: (val: number) => <Badge count={val} style={{ backgroundColor: val >= 50 ? '#16A34A' : val >= 30 ? '#1677FF' : '#F59E0B' }} />,
    },
    {
      title: '今日请求',
      dataIndex: 'todayRequests',
      key: 'todayRequests',
      width: 100,
      align: 'right',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (status: string) => {
        const cfg = recStatusConfig[status];
        return cfg ? <Tag color={cfg.color} icon={cfg.icon}>{cfg.text}</Tag> : status;
      },
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      render: (_: any, r: any) => (
        <Space size="small">
          <Tooltip title="查看详情"><Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedTask(r); setDetailModalVisible(true); }} /></Tooltip>
          <Tooltip title="测试"><Button type="text" size="small" icon={<ExperimentOutlined />} className="text-purple-500" /></Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><ScanOutlined className="text-2xl text-blue-600" /><h1 className="text-2xl font-bold m-0">智能识别</h1></div>
          <Space><Button icon={<SettingOutlined />}>模型配置</Button><Button type="primary" icon={<PlusOutlined />}>新建识别任务</Button></Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}><DataCard title="今日请求" value={todayRequests.toLocaleString()} icon={<ThunderboltOutlined />} color="#1677FF" trend="up" trendValue="+22%" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="平均准确率" value={`${avgAccuracy}%`} icon={<CheckCircleOutlined />} color="#16A34A" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="平均延迟" value={`${avgLatency}ms`} icon={<ClockCircleOutlined />} color={avgLatency < 500 ? '#16A34A' : '#F59E0B'} /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="支持格式" value={supportedFormats} icon={<ApiOutlined />} color="#7C3AED" description="输入格式种类" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="最大并发" value={maxConcurrency} icon={<LineChartOutlined />} color="#DC2626" description="单任务上限" /></Col>
        </Row>

        <DataTable columns={columns as any} dataSource={mockTasks} rowKey="id" title="识别任务列表" showSearch searchPlaceholder="搜索任务名称..." showFilter filterOptions={[{ label: '全部类型', value: '' }, ...Object.entries(recTypeConfig).map(([k, v]) => ({ label: v.label, value: k }))]} pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 个任务` }} />

        <Card title={<span><SafetyCertificateOutlined /> 识别能力矩阵</span>} className="shadow-sm">
          <Row gutter={[16, 16]}>
            {Object.entries(recTypeConfig).map(([key, config]) => {
              const tasks = mockTasks.filter(t => t.type === key);
              const avgAcc = (tasks.reduce((s, t) => s + t.accuracy, 0) / tasks.length).toFixed(1);
              return (
                <Col key={key} xs={12} sm={8} md={4}>
                  <div className="p-4 rounded-lg border text-center hover:shadow-md transition-shadow" style={{ borderColor: `${config.color}30`, backgroundColor: `${config.color}05` }}>
                    <div className="text-3xl mb-2" style={{ color: config.color }}>{config.icon}</div>
                    <div className="font-semibold text-sm">{config.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{tasks.length} 个任务</div>
                    <div className="mt-2"><Progress percent={parseFloat(avgAcc)} size="small" strokeColor={config.color} format={() => `${avgAcc}%`} /></div>
                  </div>
                </Col>
              );
            })}
          </Row>
        </Card>

        <Modal title={`识别任务详情 - ${selectedTask?.name}`} open={detailModalVisible} onCancel={() => setDetailModalVisible(false)} width={700} footer={[<Button key="close" onClick={() => setDetailModalVisible(false)}>关闭</Button>, <Button key="test" type="primary" icon={<ExperimentOutlined />}>运行测试</Button>]}>
          {selectedTask && (
            <div className="space-y-4">
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="任务ID"><Text code>{selectedTask.id}</Text></Descriptions.Item>
                <Descriptions.Item label="状态">{(() => { const c = recStatusConfig[selectedTask.status]; return c ? <Tag color={c.color} icon={c.icon}>{c.text}</Tag> : selectedTask.status; })()}</Descriptions.Item>
                <Descriptions.Item label="识别类型" span={2}>{(() => { const c = recTypeConfig[selectedTask.type]; return c ? <Tag color={c.color} icon={c.icon}>{c.label}</Tag> : selectedTask.type; })()}</Descriptions.Item>
                <Descriptions.Item label="使用模型" span={2}><Text code>{selectedTask.model}</Text></Descriptions.Item>
                <Descriptions.Item label="输入格式"><Tag>{selectedTask.inputFormat}</Tag></Descriptions.Item>
                <Descriptions.Item label="输出格式"><Tag color="green">{selectedTask.outputFormat}</Tag></Descriptions.Item>
                <Descriptions.Item label="准确率"><Text strong className={selectedTask.accuracy >= 95 ? 'text-green-600' : selectedTask.accuracy >= 90 ? 'text-blue-600' : 'text-orange-500'}>{selectedTask.accuracy}%</Text></Descriptions.Item>
                <Descriptions.Item label="平均延迟">{selectedTask.avgLatency}ms</Descriptions.Item>
                <Descriptions.Item label="并发能力">{selectedTask.concurrency} 并发</Descriptions.Item>
                <Descriptions.Item label="今日请求">{selectedTask.todayRequests.toLocaleString()}</Descriptions.Item>
              </Descriptions>
              <Divider orientation="left">任务描述</Divider>
              <Paragraph className="bg-gray-50 p-4 rounded-lg mb-0">{selectedTask.description}</Paragraph>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

import { PauseCircleOutlined } from '@ant-design/icons';
