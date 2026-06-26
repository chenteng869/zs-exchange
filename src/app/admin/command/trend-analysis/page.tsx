'use client';

import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';
import {
  Card, Tag, Button, Space, Row, Col, Typography, Progress,
  Badge, Modal, Descriptions, List, Statistic, Divider, Alert, Timeline,
} from 'antd';
import {
  LineChartOutlined,
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
  EyeOutlined,
  EditOutlined,
  ReloadOutlined,
  PlusOutlined,
  FileTextOutlined,
  DashboardOutlined,
  FundOutlined,
  AimOutlined,
  ExperimentOutlined,
  BarChartOutlined,
  PercentageOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface TrendAnalysisTask {
  id: string;
  name: string;
  category: string;
  dimension: string;
  status: 'running' | 'completed' | 'failed' | 'scheduled';
  trend: 'up' | 'down' | 'stable';
  changeRate: number;
  accuracy: number;
  dataPoints: number;
  period: string;
  lastRun: string;
  nextRun: string;
  owner: string;
  description: string;
  indicators: string[];
}

const mockTasks: TrendAnalysisTask[] = [
  {
    id: 'TA-001',
    name: 'BTC价格走势预测分析',
    category: '价格预测',
    dimension: '时间序列',
    status: 'running',
    trend: 'up',
    changeRate: 12.5,
    accuracy: 94.2,
    dataPoints: 2880,
    period: '近30天',
    lastRun: '2024-06-08 14:00:00',
    nextRun: '2024-06-08 15:00:00',
    owner: 'AI分析组-张明',
    description: '基于LSTM深度学习模型对比特币价格进行多维度时序预测，结合链上数据、市场情绪和宏观经济指标进行综合建模。',
    indicators: ['收盘价', '成交量', '持仓量', '资金费率', '活跃地址数'],
  },
  {
    id: 'TA-002',
    name: '用户活跃度趋势追踪',
    category: '用户行为',
    dimension: '用户维度',
    status: 'completed',
    trend: 'up',
    changeRate: 18.3,
    accuracy: 91.5,
    dataPoints: 1560,
    period: '近7天',
    lastRun: '2024-06-08 13:30:00',
    nextRun: '2024-06-08 20:30:00',
    owner: '运营分析组-李芳',
    description: '追踪DAU/MAU、用户留存率、功能使用频率等核心指标的变化趋势，识别用户行为模式和增长拐点。',
    indicators: ['DAU', 'MAU', '留存率', '会话时长', '功能渗透率'],
  },
  {
    id: 'TA-003',
    name: 'DeFi TVL波动性分析',
    category: 'DeFi指标',
    dimension: '协议维度',
    status: 'running',
    trend: 'down',
    changeRate: -6.8,
    accuracy: 88.7,
    dataPoints: 720,
    period: '近14天',
    lastRun: '2024-06-08 14:15:00',
    nextRun: '2024-06-08 15:15:00',
    owner: 'DeFi研究组-王强',
    description: '监控各DeFi协议总锁定价值(TVL)的变动趋势，分析资金流向和协议间的竞争态势。',
    indicators: ['TVL', 'APY', '流动性深度', '借款利用率', '清算事件'],
  },
  {
    id: 'TA-004',
    name: '交易量季节性模式识别',
    category: '交易分析',
    dimension: '时间维度',
    status: 'completed',
    trend: 'stable',
    changeRate: 1.2,
    accuracy: 96.1,
    dataPoints: 8760,
    period: '近12个月',
    lastRun: '2024-06-08 10:00:00',
    nextRun: '2024-06-09 10:00:00',
    owner: '量化分析组-赵磊',
    description: '利用傅里叶变换和季节性分解算法，识别交易量的周期性规律（日/周/月/季度），为流动性管理和营销活动提供决策支持。',
    indicators: ['24h交易量', '订单簿深度', '价差', '成交笔数', '大单占比'],
  },
  {
    id: 'TA-005',
    name: '风险指标预警趋势',
    category: '风险管理',
    dimension: '风险维度',
    status: 'running',
    trend: 'up',
    changeRate: 22.4,
    accuracy: 92.8,
    dataPoints: 2160,
    period: '近15天',
    lastRun: '2024-06-08 14:25:00',
    nextRun: '2024-06-08 14:55:00',
    owner: '风控团队-陈静',
    description: '实时监控VaR、最大回撤、夏普比率等核心风险指标的演变趋势，提前发现潜在风险聚集区域。',
    indicators: ['VaR(95%)', '最大回撤', '夏普比率', '波动率', '相关性'],
  },
  {
    id: 'TA-006',
    name: '跨链资产流动趋势',
    category: '区块链分析',
    dimension: '链上维度',
    status: 'scheduled',
    trend: 'up',
    changeRate: 35.6,
    accuracy: 89.3,
    dataPoints: 1080,
    period: '近7天',
    lastRun: '2024-06-07 23:00:00',
    nextRun: '2024-06-08 23:00:00',
    owner: '链上分析组-刘洋',
    description: '追踪ETH/BSC/Polygon等多条公链之间的资产转移规模和方向变化，洞察跨链生态发展态势。',
    indicators: ['跨链桥TVL', '转账笔数', '平均金额', '活跃钱包', 'Gas消耗'],
  },
  {
    id: 'TA-007',
    name: 'KOL影响力衰减曲线',
    category: '社交分析',
    dimension: '社交维度',
    status: 'completed',
    trend: 'down',
    changeRate: -8.9,
    accuracy: 85.4,
    dataPoints: 480,
    period: '近48小时',
    lastRun: '2024-06-08 11:00:00',
    nextRun: '2024-06-08 17:00:00',
    owner: '增长团队-孙悦',
    description: '分析各KOL推广内容的传播力随时间衰减规律，优化投放时机和内容策略以最大化ROI。',
    indicators: ['曝光量', '互动率', '转化率', 'CPA', 'LTV'],
  },
  {
    id: 'TA-008',
    name: ' Gas费用趋势预测',
    category: '成本分析',
    dimension: '成本维度',
    status: 'failed',
    trend: 'up',
    changeRate: 45.2,
    accuracy: 78.5,
    dataPoints: 1440,
    period: '近24小时',
    lastRun: '2024-06-08 12:00:00',
    nextRun: '2024-06-08 16:00:00',
    owner: '基础设施组-周凯',
    description: '预测各主链Gas价格的未来走势，帮助用户选择最佳交互时机，降低DeFi操作成本。',
    indicators: ['Gas Price', 'Gwei均值', '确认时间', '网络拥堵度', '待处理交易池'],
  },
  {
    id: 'TA-009',
    name: '市场情绪指数构建',
    category: '情绪分析',
    dimension: '情绪维度',
    status: 'running',
    trend: 'stable',
    changeRate: 2.1,
    accuracy: 90.2,
    dataPoints: 3600,
    period: '近30天',
    lastRun: '2024-06-08 14:35:00',
    nextRun: '2024-06-08 15:05:00',
    owner: 'NLP研究组-吴婷',
    description: '基于Twitter/X舆情、Reddit讨论热度、Fear&Greed Index等多源数据构建综合市场情绪指数。',
    indicators: ['恐惧贪婪指数', '社交媒体热度', '搜索指数', '新闻情感', '期权PCR'],
  },
  {
    id: 'TA-010',
    name: '合约持仓结构演化',
    category: '衍生品分析',
    dimension: '持仓维度',
    status: 'completed',
    trend: 'down',
    changeRate: -15.3,
    accuracy: 93.6,
    dataPoints: 1800,
    period: '近10天',
    lastRun: '2024-06-08 09:00:00',
    nextRun: '2024-06-08 21:00:00',
    owner: '衍生品组-郑浩',
    description: '跟踪永续合约和交割合约的多空持仓比、大户持仓集中度等指标的动态变化，预判市场方向。',
    indicators: ['多空比', '持仓集中度', '爆仓量', '资金费率', '未平仓合约'],
  },
];

export default function TrendAnalysisPage() {
  const [selectedTask, setSelectedTask] = useState<TrendAnalysisTask | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  const totalReports = mockTasks.length;
  const totalIndicators = [...new Set(mockTasks.flatMap(t => t.indicators))].length;
  const avgAccuracy = (mockTasks.reduce((sum, t) => sum + t.accuracy, 0) / mockTasks.length).toFixed(1);
  const dataSourceCount = 5;
  const automationRate = ((mockTasks.filter(t => t.status === 'running' || t.status === 'scheduled').length / mockTasks.length) * 100).toFixed(0);

  const getTrendTag = (trend: string) => {
    switch (trend) {
      case 'up':
        return <Tag icon={<RiseOutlined />} color="green">上升趋势</Tag>;
      case 'down':
        return <Tag icon={<FallOutlined />} color="red">下降趋势</Tag>;
      case 'stable':
        return <Tag icon={<MinusOutlined />} color="blue">平稳</Tag>;
      default:
        return <Tag>未知</Tag>;
    }
  };

  const getStatusBadge = (status: string) => {
    const map: Record<string, { status: string; text: string }> = {
      running: { status: 'processing', text: '运行中' },
      completed: { status: 'success', text: '已完成' },
      failed: { status: 'error', text: '执行失败' },
      scheduled: { status: 'default', text: '已调度' },
    };
    const config = map[status];
    return config ? <Badge status={config.status as any} text={config.text} /> : status;
  };

  const handleView = (record: TrendAnalysisTask) => {
    setSelectedTask(record);
    setDetailModalVisible(true);
  };

  const columns = [
    {
      title: '任务ID',
      dataIndex: 'id',
      key: 'id',
      width: 100,
      render: (id: string) => <Text code className="text-xs">{id}</Text>,
    },
    {
      title: '分析任务名称',
      dataIndex: 'name',
      key: 'name',
      width: 220,
      render: (name: string) => (
        <div>
          <div className="font-medium text-sm">{name}</div>
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      width: 110,
      render: (cat: string) => <Tag color="purple">{cat}</Tag>,
    },
    {
      title: '趋势方向',
      key: 'trend',
      width: 110,
      render: (_: any, record: TrendAnalysisTask) => getTrendTag(record.trend),
    },
    {
      title: '变化率',
      dataIndex: 'changeRate',
      key: 'changeRate',
      width: 100,
      render: (rate: number) => (
        <span className={`font-semibold ${rate > 0 ? 'text-green-600' : rate < 0 ? 'text-red-600' : 'text-gray-600'}`}>
          {rate > 0 ? '+' : ''}{rate.toFixed(1)}%
        </span>
      ),
    },
    {
      title: '预测准确率',
      dataIndex: 'accuracy',
      key: 'accuracy',
      width: 110,
      render: (acc: number) => (
        <div className="flex items-center gap-2">
          <Progress
            percent={acc}
            size="small"
            strokeColor={acc >= 90 ? '#16A34A' : acc >= 80 ? '#F59E0B' : '#DC2626'}
            className="w-20"
          />
          <span className="text-xs font-medium">{acc}%</span>
        </div>
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
      title: '负责人',
      dataIndex: 'owner',
      key: 'owner',
      width: 140,
      render: (owner: string) => <span className="text-sm">{owner}</span>,
    },
    {
      title: '最后执行',
      dataIndex: 'lastRun',
      key: 'lastRun',
      width: 150,
      render: (time: string) => <span className="text-xs text-gray-500">{time}</span>,
    },
  ];

  const actions = [
    { key: 'view', label: '详情', icon: <EyeOutlined />, onClick: handleView },
    { key: 'edit', label: '编辑', icon: <EditOutlined /> },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* 页头 */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <LineChartOutlined style={{ color: '#1677FF' }} />
              趋势分析
            </h1>
            <p className="text-gray-500 mt-1">多维度趋势分析 · 指标对比 · 预测曲线 · 智能洞察</p>
          </div>
          <Space>
            <Button type="primary" icon={<PlusOutlined />}>
              新建分析任务
            </Button>
            <Button icon={<ReloadOutlined />}>刷新</Button>
            <Button icon={<DashboardOutlined />}>导出报告</Button>
          </Space>
        </div>

        {/* 数据卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="分析报告数"
              value={totalReports}
              suffix="份"
              icon={<FileTextOutlined />}
              color="#1677FF"
              trend="up"
              trendValue="+3"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="覆盖指标"
              value={totalIndicators}
              suffix="个"
              icon={<FundOutlined />}
              color="#7C3AED"
              trend="up"
              trendValue="+8"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="预测准确率"
              value={avgAccuracy}
              suffix="%"
              icon={<AimOutlined />}
              color="#16A34A"
              trend="up"
              trendValue="+2.1"
            />
          </Col>
          <Col xs={24} sm={12} lg={5}>
            <DataCard
              title="数据源数量"
              value={dataSourceCount}
              suffix="个"
              icon={<ExperimentOutlined />}
              color="#F59E0B"
              trend="none"
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <DataCard
              title="自动化率"
              value={automationRate}
              suffix="%"
              icon={<ThunderboltOutlined />}
              color="#DC2626"
              trend="up"
              trendValue="+5"
            />
          </Col>
        </Row>

        {/* 趋势分析任务列表 */}
        <DataTable
          columns={columns}
          dataSource={mockTasks}
          rowKey="id"
          title="趋势分析任务列表"
          searchPlaceholder="搜索任务名称、分类或负责人..."
          actions={actions}
          pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条分析任务` }}
          showFilter
          filterOptions={[
            { label: '全部状态', value: '' },
            { label: '运行中', value: 'running' },
            { label: '已完成', value: 'completed' },
            { label: '已调度', value: 'scheduled' },
            { label: '执行失败', value: 'failed' },
          ]}
        />

        {/* 业务特性说明 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <BarChartOutlined style={{ color: '#1677FF' }} />
                  趋势分析方法论
                </span>
              }
              className="shadow-sm"
            >
              <List
                size="small"
                dataSource={[
                  {
                    title: '时间序列分析',
                    description: 'ARIMA/LSTM/Prophet等多种模型组合，自动选择最优预测方法',
                  },
                  {
                    title: '多维关联分析',
                    description: '跨指标、跨周期、跨市场的多维度关联挖掘，发现隐藏规律',
                  },
                  {
                    title: '异常检测引擎',
                    description: '基于统计方法和机器学习的双重异常检测机制，及时预警',
                  },
                  {
                    title: '因果推断框架',
                    description: '区分相关性与因果关系，提供可解释的分析结论',
                  },
                ]}
                renderItem={(item) => (
                  <List.Item>
                    <div className="flex items-start gap-3 w-full">
                      <CheckCircleOutlined className="text-green-500 mt-1" />
                      <div className="flex-1">
                        <div className="font-medium">{item.title}</div>
                        <div className="text-sm text-gray-500 mt-1">{item.description}</div>
                      </div>
                    </div>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <span className="flex items-center gap-2">
                  <PercentageOutlined style={{ color: '#F59E0B' }} />
                  趋势方向分布统计
                </span>
              }
              className="shadow-sm"
            >
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <RiseOutlined style={{ color: '#16A34A' }} />
                      上升趋势
                    </span>
                    <span className="font-semibold text-green-600">
                      {mockTasks.filter(t => t.trend === 'up').length} 项
                    </span>
                  </div>
                  <Progress
                    percent={(mockTasks.filter(t => t.trend === 'up').length / mockTasks.length) * 100}
                    strokeColor="#16A34A"
                    showInfo={false}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <FallOutlined style={{ color: '#DC2626' }} />
                      下降趋势
                    </span>
                    <span className="font-semibold text-red-600">
                      {mockTasks.filter(t => t.trend === 'down').length} 项
                    </span>
                  </div>
                  <Progress
                    percent={(mockTasks.filter(t => t.trend === 'down').length / mockTasks.length) * 100}
                    strokeColor="#DC2626"
                    showInfo={false}
                  />
                </div>
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="flex items-center gap-2">
                      <MinusOutlined style={{ color: '#1677FF' }} />
                      平稳趋势
                    </span>
                    <span className="font-semibold text-blue-600">
                      {mockTasks.filter(t => t.trend === 'stable').length} 项
                    </span>
                  </div>
                  <Progress
                    percent={(mockTasks.filter(t => t.trend === 'stable').length / mockTasks.length) * 100}
                    strokeColor="#1677FF"
                    showInfo={false}
                  />
                </div>

                <Divider />

                <Alert
                  message="智能建议"
                  description="当前有5个任务呈上升趋势，建议重点关注风险指标预警趋势（+22.4%）和跨链资产流动趋势（+35.6%）的变化"
                  type="info"
                  showIcon
                  icon={<AimOutlined />}
                />
              </div>
            </Card>
          </Col>
        </Row>

        {/* 详情弹窗 */}
        <Modal
          title={`分析任务详情 - ${selectedTask?.name}`}
          open={detailModalVisible}
          onCancel={() => setDetailModalVisible(false)}
          width={720}
          footer={
            <Space>
              <Button icon={<EyeOutlined />}>查看图表</Button>
              <Button icon={<EditOutlined />}>编辑配置</Button>
              <Button type="primary" icon={<BarChartOutlined />}>
                生成报告
              </Button>
            </Space>
          }
        >
          {selectedTask && (
            <div className="space-y-4">
              <Descriptions bordered column={2} size="middle">
                <Descriptions.Item label="任务ID">
                  <Text strong className="text-blue-600">{selectedTask.id}</Text>
                </Descriptions.Item>
                <Descriptions.Item label="分析分类">
                  <Tag color="purple">{selectedTask.category}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="分析维度">
                  <Tag color="blue">{selectedTask.dimension}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="趋势方向">
                  {getTrendTag(selectedTask.trend)}
                </Descriptions.Item>
                <Descriptions.Item label="变化率">
                  <span className={`font-bold ${selectedTask.changeRate > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {selectedTask.changeRate > 0 ? '+' : ''}{selectedTask.changeRate.toFixed(1)}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="预测准确率">
                  <Progress
                    percent={selectedTask.accuracy}
                    size="small"
                    format={() => `${selectedTask.accuracy}%`}
                    strokeColor={selectedTask.accuracy >= 90 ? '#16A34A' : '#F59E0B'}
                  />
                </Descriptions.Item>
                <Descriptions.Item label="数据点数" span={2}>
                  {selectedTask.dataPoints.toLocaleString()} 个 · 分析周期: {selectedTask.period}
                </Descriptions.Item>
                <Descriptions.Item label="执行状态" span={2}>
                  {getStatusBadge(selectedTask.status)}
                </Descriptions.Item>
                <Descriptions.Item label="负责人" span={2}>
                  {selectedTask.owner}
                </Descriptions.Item>
                <Descriptions.Item label="上次运行" span={2}>
                  {selectedTask.lastRun}
                </Descriptions.Item>
                <Descriptions.Item label="下次运行" span={2}>
                  {selectedTask.nextRun}
                </Descriptions.Item>
                <Descriptions.Item label="任务描述" span={2}>
                  <Paragraph className="text-sm mb-0">{selectedTask.description}</Paragraph>
                </Descriptions.Item>
              </Descriptions>

              <Card size="small" title="覆盖指标">
                <div className="flex flex-wrap gap-2">
                  {selectedTask.indicators.map((ind) => (
                    <Tag key={ind} color="cyan">{ind}</Tag>
                  ))}
                </div>
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
