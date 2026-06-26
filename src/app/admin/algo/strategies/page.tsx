'use client';

import { useState } from 'react';
import {
  Modal,
  Tag,
  Progress,
  Badge,
  Button,
  Space,
  Descriptions,
  Divider,
  Row,
  Col,
} from 'antd';
import {
  ThunderboltOutlined,
  RobotOutlined,
  LineChartOutlined,
  AimOutlined,
  FundOutlined,
  ApiOutlined,
  EyeOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

interface StrategyModel {
  id: string;
  name: string;
  type: string;
  accuracy: number;
  sharpe: number;
  dailyReturn: number;
  status: string;
  signalsToday: number;
  winRate: number;
  coverage: string[];
}

const mockStrategies: StrategyModel[] = [
  { id: 'ML-001', name: 'LSTM-BTC 趋势预测', type: 'DL', accuracy: 87.5, sharpe: 3.12, dailyReturn: 1.85, status: 'running', signalsToday: 24, winRate: 72.3, coverage: ['BTC', 'ETH'] },
  { id: 'ML-002', name: 'XGBoost 多因子选币', type: 'ML', accuracy: 82.3, sharpe: 2.68, dailyReturn: 1.42, status: 'running', signalsToday: 18, winRate: 68.5, coverage: ['BTC', 'ETH', 'SOL', 'ARB'] },
  { id: 'ML-003', name: 'RL-DQN 动态仓位管理', type: 'RL', accuracy: 79.8, sharpe: 2.95, dailyReturn: 2.15, status: 'running', signalsToday: 35, winRate: 65.2, coverage: ['BTC'] },
  { id: 'ML-004', name: 'Transformer-Sentiment 情绪分析', type: 'DL', accuracy: 84.2, sharpe: 2.45, dailyReturn: 0.98, status: 'paused', signalsToday: 0, winRate: 70.1, coverage: ['BTC', 'ETH', 'SOL'] },
  { id: 'ML-005', name: 'LightGBM 异常检测引擎', type: 'ML', accuracy: 91.5, sharpe: 3.58, dailyReturn: 0.65, status: 'running', signalsToday: 8, winRate: 85.4, coverage: ['ALL'] },
  { id: 'ML-006', name: 'CNN-K线形态识别', type: 'DL', accuracy: 76.4, sharpe: 1.89, dailyReturn: 1.22, status: 'training', signalsToday: 0, winRate: 62.8, coverage: ['BTC', 'ETH'] },
  { id: 'ML-007', name: 'PPO-多资产组合优化', type: 'RL', accuracy: 81.7, sharpe: 3.25, dailyReturn: 1.78, status: 'running', signalsToday: 12, winRate: 69.3, coverage: ['BTC', 'ETH', 'SOL', 'AVAX'] },
  { id: 'ML-008', name: 'RandomForest-资金流向追踪', type: 'ML', accuracy: 88.9, sharpe: 2.78, dailyReturn: 1.55, status: 'running', signalsToday: 28, winRate: 74.6, coverage: ['BTC', 'ETH', 'BNB'] },
  { id: 'ML-009', name: 'GAN-价格生成对抗网络', type: 'DL', accuracy: 72.1, sharpe: 1.56, dailyReturn: -0.32, status: 'error', signalsToday: 0, winRate: 55.2, coverage: ['BTC'] },
  { id: 'ML-010', name: 'A3C-高频做市策略', type: 'RL', accuracy: 83.5, sharpe: 4.02, dailyReturn: 2.88, status: 'running', signalsToday: 156, winRate: 67.8, coverage: ['BTC/USDT', 'ETH/USDT'] },
  { id: 'ML-011', name: 'CatBoost-链上数据特征工程', type: 'ML', accuracy: 86.2, sharpe: 3.01, dailyReturn: 1.92, status: 'running', signalsToday: 15, winRate: 71.5, coverage: ['ETH', 'SOL', 'MATIC'] },
  { id: 'ML-012', name: 'BERT-新闻情绪量化', type: 'DL', accuracy: 80.4, sharpe: 2.33, dailyReturn: 1.15, status: 'paused', signalsToday: 0, winRate: 66.9, coverage: ['ALL'] },
];

const typeColorMap: Record<string, string> = {
  ML: 'blue',
  DL: 'purple',
  RL: 'gold',
};

const typeLabelMap: Record<string, string> = {
  ML: '机器学习',
  DL: '深度学习',
  RL: '强化学习',
};

const statusColorMap: Record<string, any> = {
  running: 'processing',
  paused: 'warning',
  training: 'cyan',
  error: 'error',
};

const statusLabelMap: Record<string, string> = {
  running: '运行中',
  paused: '已暂停',
  training: '训练中',
  error: '异常',
};

export default function AlgoStrategiesPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<StrategyModel | null>(null);

  const handleViewDetail = (record: StrategyModel) => {
    setSelectedModel(record);
    setDetailModalOpen(true);
  };

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      onClick: handleViewDetail,
    },
    {
      key: 'start',
      label: '启动',
      icon: <PlayCircleOutlined />,
      hidden: (r: StrategyModel) => r.status === 'running' || r.status === 'training',
    },
    {
      key: 'pause',
      label: '暂停',
      icon: <PauseCircleOutlined />,
      hidden: (r: StrategyModel) => r.status !== 'running',
    },
    {
      key: 'config',
      label: '配置',
      icon: <SettingOutlined />,
    },
  ];

  const columns = [
    {
      title: '模型名称',
      dataIndex: 'name',
      key: 'modelName',
      render: (t: string) => <span className="font-semibold text-blue-600">{t}</span>,
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'modelType',
      render: (t: string) => (
        <Tag color={typeColorMap[t]}>{typeLabelMap[t]}</Tag>
      ),
    },
    {
      title: '准确率',
      dataIndex: 'accuracy',
      key: 'accuracy',
      render: (v: number) => (
        <Progress percent={v} size="small" strokeColor={v > 85 ? '#16A34A' : v > 75 ? '#1677FF' : '#F59E0B'} />
      ),
    },
    {
      title: 'Sharpe',
      dataIndex: 'sharpe',
      key: 'sharpeRatio',
      render: (v: number) => (
        <span style={{ color: v > 3 ? '#16A34A' : v > 2 ? '#1677FF' : '#F59E0B', fontWeight: 600 }}>
          {v.toFixed(2)}
        </span>
      ),
    },
    {
      title: '日收益',
      dataIndex: 'dailyReturn',
      key: 'dailyPnl',
      render: (v: number) => (
        <span style={{ color: v >= 0 ? '#16A34A' : '#DC2626', fontWeight: 600 }}>
          {v >= 0 ? '+' : ''}{v.toFixed(2)}%
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'modelStatus',
      render: (s: string) => (
        <Badge status={statusColorMap[s]} text={statusLabelMap[s]} />
      ),
    },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <RobotOutlined /> 算法策略引擎
            </h1>
            <p className="text-gray-500 mt-1">机器学习驱动的交易信号生成 · 模型训练·回测优化·在线推理</p>
          </div>
          <Space>
            <Button icon={<ThunderboltOutlined />}>批量训练</Button>
            <Button type="primary" icon={<ApiOutlined />}>新建模型</Button>
          </Space>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="活跃模型数"
              value={9}
              suffix="/ 12"
              icon={<RobotOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+2 本周"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="今日信号"
              value={296}
              icon={<ThunderboltOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+18.5%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="综合胜率"
              value="69.2"
              suffix="%"
              icon={<LineChartOutlined />}
              color="#F59E0B"
              trend="up"
              trendValue="+2.3%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="平均收益"
              value="1.46"
              suffix="%/日"
              icon={<FundOutlined />}
              color="#7C3AED"
              trend="down"
              trendValue="-0.12%"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="平均Sharpe"
              value="2.76"
              icon={<AimOutlined />}
              color="#DC2626"
              trend="up"
              trendValue="+0.15"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="覆盖币种"
              value="28"
              suffix="个交易对"
              icon={<ApiOutlined />}
              color="#0891B2"
            />
          </Col>
        </Row>

        {/* DataTable */}
        <DataTable
          columns={columns}
          dataSource={mockStrategies}
          rowKey="id"
          title="策略模型列表"
          searchPlaceholder="搜索模型名称..."
          addButtonText="部署模型"
          actions={actions}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `共 ${total} 个模型` }}
        />

        {/* 策略详情 Modal */}
        <Modal
          title={`模型详情 — ${selectedModel?.name || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
            <Button key="train" type="primary" icon={<ThunderboltOutlined />}>重新训练</Button>,
          ]}
          width={720}
        >
          {selectedModel && (
            <div className="space-y-4">
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="模型ID">{selectedModel.id}</Descriptions.Item>
                <Descriptions.Item label="类型">
                  <Tag color={typeColorMap[selectedModel.type]}>{typeLabelMap[selectedModel.type]}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="准确率">{selectedModel.accuracy}%</Descriptions.Item>
                <Descriptions.Item label="Sharpe比率">{selectedModel.sharpe.toFixed(2)}</Descriptions.Item>
                <Descriptions.Item label="日均收益">
                  <span style={{ color: selectedModel.dailyReturn >= 0 ? '#16A34A' : '#DC2626' }}>
                    {selectedModel.dailyReturn >= 0 ? '+' : ''}{selectedModel.dailyReturn.toFixed(2)}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="胜率">{selectedModel.winRate}%</Descriptions.Item>
                <Descriptions.Item label="今日信号">{selectedModel.signalsToday}</Descriptions.Item>
                <Descriptions.Item label="覆盖范围">
                  {selectedModel.coverage.map((c) => (
                    <Tag key={c} color="blue">{c}</Tag>
                  ))}
                </Descriptions.Item>
                <Descriptions.Item label="状态" span={2}>
                  <Badge status={statusColorMap[selectedModel.status]} text={statusLabelMap[selectedModel.status]} />
                </Descriptions.Item>
              </Descriptions>

              <Divider>参数配置</Divider>

              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold mb-2 text-gray-600">训练参数</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>学习率:</span><span className="font-mono">0.001</span></div>
                      <div className="flex justify-between"><span>批次大小:</span><span className="font-mono">256</span></div>
                      <div className="flex justify-between"><span>迭代次数:</span><span className="font-mono">10000</span></div>
                      <div className="flex justify-between"><span>正则化(L2):</span><span className="font-mono">1e-5</span></div>
                      <div className="flex justify-between"><span>Dropout:</span><span className="font-mono">0.2</span></div>
                    </div>
                  </div>
                </Col>
                <Col span={12}>
                  <div className="rounded-lg border border-gray-200 p-4 bg-gray-50">
                    <h4 className="text-sm font-semibold mb-2 text-gray-600">推理参数</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between"><span>置信度阈值:</span><span className="font-mono">0.75</span></div>
                      <div className="flex justify-between"><span>信号冷却期:</span><span className="font-mono">300s</span></div>
                      <div className="flex justify-between"><span>最大持仓比:</span><span className="font-mono">30%</span></div>
                      <div className="flex justify-between"><span>止损线:</span><span className="font-mono">-5%</span></div>
                      <div className="flex justify-between"><span>回撤限制:</span><span className="font-mono">10%</span></div>
                    </div>
                  </div>
                </Col>
              </Row>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
