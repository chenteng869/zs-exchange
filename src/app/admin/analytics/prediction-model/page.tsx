'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Card, Tag, Badge, Button, Space, Row, Col, Typography, Divider, Progress, Statistic, Alert, Tooltip, Modal, message,
} from 'antd';
import {
  ExperimentOutlined, LineChartOutlined, ThunderboltOutlined, CloudServerOutlined, DatabaseOutlined,
  EyeOutlined, PlayCircleOutlined, AimOutlined, RocketOutlined, SafetyCertificateOutlined, BarChartOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Title, Text } = Typography;

// Mock数据 - 预测模型列表
const mockModels = [
  { id: 'PM-001', name: 'BTC价格预测-LSTM', targetVar: 'BTC收盘价', algorithm: 'LSTM', rmse: 342.5, mae: 256.8, accuracy: 94.2, status: 'running', lastTrain: '2024-06-23 02:00', dataSource: '币安K线+链上数据' },
  { id: 'PM-002', name: '交易量预测-XGBoost', targetVar: '日交易量(USDT)', algorithm: 'XGBoost', rmse: 1250.3, mae: 890.2, accuracy: 91.8, status: 'running', lastTrain: '2024-06-22 18:30', dataSource: '历史订单+用户行为' },
  { id: 'PM-003', name: '用户流失预警-LightGBM', targetVar: '流失概率', algorithm: 'LightGBM', rmse: 0.068, mae: 0.042, accuracy: 92.5, status: 'running', lastTrain: '2024-06-22 10:00', dataSource: '用户行为日志' },
  { id: 'PM-004', name: 'NFT趋势-Prophet', targetVar: 'NFT地板价', algorithm: 'Prophet', rmse: 28.4, mae: 18.6, accuracy: 87.3, status: 'training', lastTrain: '2024-06-22 22:00', dataSource: 'OpenSea+LooksRare' },
  { id: 'PM-005', name: 'Gas费用预测-ARIMA', targetVar: 'ETH Gas Price', algorithm: 'ARIMA', rmse: 12.5, mae: 8.2, accuracy: 89.7, status: 'running', lastTrain: '2024-06-21 14:20', dataSource: 'Etherscan Gas Tracker' },
  { id: 'PM-006', name: '流动性风险-Ensemble', targetVar: '流动性压力指数', algorithm: 'Stacking', rmse: 0.045, mae: 0.032, accuracy: 96.1, status: 'stopped', lastTrain: '2024-06-18 09:00', dataSource: '深度订单簿+资金池' },
  { id: 'PM-007', name: '情绪指数-BERT', targetVar: '市场情绪得分', algorithm: 'BERT+MLP', rmse: 0.123, mae: 0.089, accuracy: 88.4, status: 'running', lastTrain: '2024-06-21 16:45', dataSource: 'Twitter+Reddit+新闻' },
  { id: 'PM-008', name: '波动率预测-GARCH', targetVar: '30日隐含波动率', algorithm: 'GARCH', rmse: 0.032, mae: 0.024, accuracy: 90.6, status: 'running', lastTrain: '2024-06-22 08:30', dataSource: '期权市场IV数据' },
  { id: 'PM-009', name: 'DeFi TVL预测-Transformer', targetVar: '协议TVL($B)', algorithm: 'Transformer', rmse: 45.2, mae: 32.1, accuracy: 85.9, status: 'training', lastTrain: '2024-06-23 00:00', dataSource: 'DefiLlama API' },
  { id: 'PM-010', name: '清算事件-RF', targetVar: '清算概率', algorithm: 'RandomForest', rmse: 0.056, mae: 0.038, accuracy: 93.2, status: 'running', lastTrain: '2024-06-21 11:30', dataSource: 'AAVE/Compound借贷数据' },
];

export default function PredictionModelPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<any>(null);

  const { data: models, isLoading } = useQuery({
    queryKey: ['analytics-prediction-models'],
    queryFn: async () => {
      await new Promise(r => setTimeout(r, 500));
      return mockModels;
    },
  });

  // 模型精度颜色条
  const getAccuracyColor = (acc: number) => {
    if (acc >= 95) return '#16A34A';
    if (acc >= 90) return '#1677FF';
    if (acc >= 85) return '#F59E0B';
    return '#DC2626';
  };

  // 状态Badge
  const getStatusBadge = (status: string) => {
    const map: Record<string, { status: string; text: string }> = {
      running: { status: 'success', text: '运行中' },
      training: { status: 'processing', text: '训练中' },
      stopped: { status: 'default', text: '已停止' },
    };
    const item = map[status] || { status: 'default', text: status };
    return <Badge status={item.status as any} text={item.text} />;
  };

  const columns = [
    {
      title: '模型名称',
      key: 'name',
      width: 220,
      render: (_: any, record: any) => (
        <Space>
          <ExperimentOutlined className={record.status === 'running' ? 'text-green-500' : record.status === 'training' ? 'text-blue-500 animate-pulse' : 'text-gray-400'} />
          <div>
            <Text strong>{record.name}</Text>
            <br /><Text type="secondary" className="text-xs">{record.algorithm}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: '目标变量',
      dataIndex: 'targetVar',
      key: 'targetVar',
      width: 160,
      render: (val: string) => <Tag color="blue">{val}</Tag>,
    },
    {
      title: 'RMSE',
      dataIndex: 'rmse',
      key: 'rmse',
      width: 100,
      render: (val: number) => <Text code>{typeof val === 'number' ? val.toFixed(2) : val}</Text>,
    },
    {
      title: '准确率',
      key: 'accuracy',
      width: 130,
      render: (_: any, record: any) => (
        <Progress percent={Math.round(record.accuracy)} size="small" strokeColor={getAccuracyColor(record.accuracy)} format={(percent) => `${percent}%`} />
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => getStatusBadge(status),
    },
    {
      title: '上次训练',
      dataIndex: 'lastTrain',
      key: 'lastTrain',
      width: 140,
    },
  ];

  const actions: any[] = [
    { key: 'view', label: '查看详情', icon: <EyeOutlined />, onClick: (record: any) => { setSelectedModel(record); setDetailModalOpen(true); } },
    { key: 'retrain', label: '重新训练', icon: <ThunderboltOutlined />, type: 'primary', hidden: () => false, onClick: (record: any) => { message.success(`已提交 ${record.name} 的重训练任务`); } },
  ];

  const avgRmse = models ? (models.reduce((s: number, m: any) => s + m.rmse, 0) / models.length).toFixed(1) : 0;
  const runningCount = models?.filter((m: any) => m.status === 'running').length || 0;
  const trainingCount = models?.filter((m: any) => m.status === 'training').length || 0;

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LineChartOutlined className="text-3xl text-blue-600" />
            <div><Title level={3} className="!mb-0">预测模型中心</Title><Text type="secondary">模型管理 · 训练任务 · 模型评估</Text></div>
          </div>
          <Space><Button icon={<BarChartOutlined />}>模型对比</Button><Button type="primary" icon={<RocketOutlined />}>新建模型</Button></Space>
        </div>

        {/* DataCards */}
        <Row gutter={[20, 20]}>
          <Col xs={24} sm={12} lg={5}><DataCard title="模型数量" value={models?.length || 0} icon={<ExperimentOutlined />} color="#1677FF" suffix="个" description="已注册的预测模型" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="平均RMSE" value={avgRmse} icon={<AimOutlined />} color="#16A34A" description="均方根误差均值" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="训练任务" value={trainingCount} icon={<PlayCircleOutlined />} color="#F59E0B" suffix="个" trend="up" trendValue="+2" description="正在训练中" /></Col>
          <Col xs={24} sm={12} lg={5}><DataCard title="在线服务" value={runningCount} icon={<CloudServerOutlined />} color="#7C3AED" suffix="个" description="提供在线推理服务" /></Col>
          <Col xs={24} sm={12} lg={4}><DataCard title="数据源" value={8} icon={<DatabaseOutlined />} color="#06B6D4" suffix="个" description="接入的数据源数量" /></Col>
        </Row>

        {/* DataTable */}
        <Card title="预测模型列表" className="shadow-sm" extra={<Space><Badge count={runningCount} style={{ backgroundColor: '#16A34A' }}><Tag color="green">在线</Tag></Badge><Tag color="blue">共 {models?.length || 0} 个</Tag></Space>}>
          <DataTable columns={columns} dataSource={models || []} loading={isLoading} actions={actions} rowKey="id" showSearch searchPlaceholder="搜索模型或算法" showFilter filterOptions={[{ label: '全部状态', value: '' }, { label: '运行中', value: 'running' }, { label: '训练中', value: 'training' }, { label: '已停止', value: 'stopped' }]} pagination={{ pageSize: 8, showSizeChanger: true, showTotal: (total) => `共 ${total} 个模型` }} />
        </Card>

        {/* 特性说明区域 */}
        <Row gutter={[20, 20]}>
          <Col xs={24} lg={12}>
            <Card title={<Space><SafetyCertificateOutlined /><span>模型性能概览</span></Space>} className="shadow-sm">
              <div className="space-y-4">
                <Row gutter={[16, 16]}>
                  <Col span={8}><Statistic title="最高精度" value={Math.max(...(models?.map((m: any) => m.accuracy) || [0]))} suffix="%" valueStyle={{ color: '#16A34A', fontSize: 18 }} /></Col>
                  <Col span={8}><Statistic title="最低RMSE" value={Math.min(...(models?.map((m: any) => m.rmse) || [999])).toFixed(2)} valueStyle={{ color: '#1677FF', fontSize: 18 }} /></Col>
                  <Col span={8}><Statistic title="平均MAE" value={models ? (models.reduce((s: number, m: any) => s + m.mae, 0) / models.length).toFixed(1) : 0} valueStyle={{ color: '#7C3AED', fontSize: 18 }} /></Col>
                </Row>
                <Divider /><Alert type="success" showIcon message="模型评估体系完善" description={<Space><Badge status="success" text="交叉验证 K=5" /><Badge status="processing" text="特征重要性分析" /><Badge status="warning" text="持续监控中" /></Space>} />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card title={<Space><ThunderboltOutlined /><span>建模能力说明</span></Space>} className="shadow-sm">
              <div className="space-y-3">
                <Alert type="info" showIcon banner message="端到端机器学习平台" description="从数据处理、特征工程、模型训练到部署上线的全流程自动化平台" />
                <Divider />
                <div className="bg-gray-50 rounded-lg p-4"><Text strong>核心能力：</Text><ul className="mt-2 space-y-2 text-sm text-gray-600 ml-4">
                  <li><ExperimentOutlined className="mr-2 text-blue-500" /> 多算法支持：LSTM/XGBoost/LightGBM/Prophet/Transformer等</li>
                  <li><LineChartOutlined className="mr-2 text-green-500" /> 自动化调参：贝叶斯优化+网格搜索，自动选择最优超参数</li>
                  <li><BarChartOutlined className="mr-2 text-orange-500" /> 模型评估：支持交叉验证、时序回测、A/B测试多维度评估</li>
                  <li><DatabaseOutlined className="mr-2 text-purple-500" /> 多源融合：结构化+非结构化+实时流数据的统一处理</li>
                  <li><RocketOutlined className="mr-2 text-red-500" /> 一键部署：模型打包→容器化→API发布，分钟级上线</li>
                </ul></div>
                <div className="bg-blue-50 rounded-lg p-3 mt-3"><Text type="secondary" className="text-sm"><PlayCircleOutlined className="mr-1 text-blue-500" /> 支持 Python/R | GPU加速 | 分布式训练</Text></div>
              </div>
            </Card>
          </Col>
        </Row>

        {/* 详情弹窗 */}
        <Modal title={`模型详情 - ${selectedModel?.name || ''}`} open={detailModalOpen} onCancel={() => setDetailModalOpen(false)} footer={[<Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>, <Button key="retrain" type="primary" icon={<ThunderboltOutlined />} onClick={() => { message.success('重训练任务已提交'); setDetailModalOpen(false); }}>重新训练</Button>]} width={700}>
          {selectedModel && (<div className="space-y-4 mt-4"><Row gutter={[16, 16]}><Col span={12}><Statistic title="模型名称" value={selectedModel.name} /></Col><Col span={12}><Statistic title="目标变量" value="" prefix={<Tag color="blue">{selectedModel.targetVar}</Tag>} /></Col><Col span={8}><Statistic title="准确率" value={selectedModel.accuracy} suffix="%" valueStyle={{ color: getAccuracyColor(selectedModel.accuracy) }} /></Col><Col span={8}><Statistic title="RMSE" value={selectedModel.rmse.toFixed(2)} /></Col><Col span={8}><Statistic title="MAE" value={selectedModel.mae.toFixed(2)} /></Col><Col span={12}><Statistic title="状态" value="" prefix={getStatusBadge(selectedModel.status)} /></Col><Col span={12}><Statistic title="最后训练" value={selectedModel.lastTrain} /></Col></Row><Divider /><div><Text strong>数据源：</Text><Text type="secondary">{selectedModel.dataSource}</Text></div><div className="mt-2"><Text strong>精度指标：</Text><Progress percent={Math.round(selectedModel.accuracy)} strokeColor={getAccuracyColor(selectedModel.accuracy)} className="mt-1" /></div></div>)}
        </Modal>
      </div>
    </AdminLayout>
  );
}
