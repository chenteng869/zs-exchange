'use client';

import { useState } from 'react';
import {
  Row, Col, Card, Tag, Button, Space, Modal, Form, Input, Select, Descriptions, Typography, Tooltip, message, Progress, Divider, Badge, Alert,
} from 'antd';
import {
  ThunderboltOutlined, EyeOutlined, EditOutlined, PlusOutlined, SettingOutlined,
  BarChartOutlined, RiseOutlined, TeamOutlined, ExperimentOutlined, LineChartOutlined,
  SafetyCertificateOutlined, FireOutlined, StarOutlined, PercentageOutlined,
  SwapOutlined, CheckCircleOutlined, WarningOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataCard } from '@/components/admin/DataCard';
import { DataTable } from '@/components/admin/DataTable';

const { Text, Paragraph } = Typography;

// 模拟推荐策略数据
const mockStrategies = [
  {
    id: 'STRAT-001', name: '首页个性化推荐', scene: '首页', algorithm: 'DeepFM + DNN',
    ctr: 4.82, conversionRate: 2.35, coverage: 68.5, abTests: 2, status: 'running',
    description: '融合深度因子分解机和DNN的用户兴趣建模，输出Top-K商品列表',
    features: ['用户画像', '行为序列', '实时特征', '多目标优化'],
    lastUpdated: '2024-06-07',
  },
  {
    id: 'STRAT-002', name: '相关商品协同过滤', scene: '详情页', algorithm: 'ItemCF + ANN',
    ctr: 3.56, conversionRate: 3.12, coverage: 82.3, abTests: 1, status: 'running',
    description: '基于物品协同过滤的相似商品推荐，结合ANN近邻检索加速',
    features: ['协同过滤', '向量检索', '冷启动处理'],
    lastUpdated: '2024-06-05',
  },
  {
    id: 'STRAT-003', name: '搜索结果重排序', scene: '搜索页', algorithm: 'LambdaMART',
    ctr: 6.21, conversionRate: 4.58, coverage: 100, abTests: 3, status: 'running',
    description: '搜索结果的多目标精排，平衡相关性、商业价值和用户体验',
    features: ['LTR学习排序', '多目标', '业务规则'],
    lastUpdated: '2024-06-06',
  },
  {
    id: 'STRAT-004', name: '购物车补充推荐', scene: '购物车', algorithm: 'Rule-Based + ML',
    ctr: 5.43, conversionRate: 8.92, coverage: 45.6, abTests: 1, status: 'paused',
    description: '基于购物车商品的互补品和替代品推荐，规则引擎兜底',
    features: ['关联规则', '互补分析', '库存感知'],
    lastUpdated: '2024-05-28',
  },
  {
    id: 'STRAT-005', name: 'Push通知千人千面', scene: '推送通知', algorithm: 'XGBoost + RL',
    ctr: 8.95, conversionRate: 1.23, coverage: 55.2, abTests: 4, status: 'running',
    description: '强化学习优化的推送时机和内容选择，控制打扰率提升转化',
    features: ['强化学习', '时机优化', '频次控制', 'A/B实验'],
    lastUpdated: '2024-06-08',
  },
  {
    id: 'STRAT-006', name: '新人冷启动推荐', scene: '新人引导', algorithm: 'Bandit + Content',
    ctr: 7.34, conversionRate: 5.67, coverage: 100, abTests: 2, status: 'running',
    description: '基于Bandit算法的探索-利用策略，快速捕捉新用户偏好',
    features: ['冷启动', '探索利用', '内容标签', '快速收敛'],
    lastUpdated: '2024-06-04',
  },
  {
    id: 'STRAT-007', name: '会员专属权益推荐', scene: '会员中心', algorithm: 'Knowledge Graph',
    ctr: 3.12, conversionRate: 6.78, coverage: 72.1, abTests: 0, status: 'testing',
    description: '基于知识图谱的会员权益匹配，推荐最相关的升级方案',
    features: ['知识图谱', '会员体系', '权益匹配'],
    lastUpdated: '2024-06-02',
  },
  {
    id: 'STRAT-008', name: '流失用户召回', scene: '运营活动', algorithm: 'Propensity Model',
    ctr: 2.18, conversionRate: 12.45, coverage: 35.8, abTests: 1, status: 'running',
    description: '预测流失概率高的用户，精准投放优惠券和召回内容',
    features: ['流失预测', '优惠券策略', '生命周期'],
    lastUpdated: '2024-06-01',
  },
  {
    id: 'STRAT-009', name: '直播商品实时推荐', scene: '直播间', algorithm: 'Real-time Ranking',
    ctr: 9.56, conversionRate: 3.89, coverage: 88.4, abTests: 2, status: 'running',
    description: '直播间实时上下文的商品推荐，结合主播讲解和观众互动信号',
    features: ['实时计算', '多路召回', '互动信号', '时序特征'],
    lastUpdated: '2024-06-07',
  },
  {
    id: 'STRAT-010', name: '跨域推荐(站外→站内)', scene: '广告投放', algorithm: 'DQN',
    ctr: 1.85, conversionRate: 0.92, coverage: 28.3, abTests: 1, status: 'draft',
    description: '深度强化学习的跨域推荐，将外部流量引导至最匹配的落地页',
    features: ['DQN强化学习', '跨域映射', '归因分析'],
    lastUpdated: '2024-05-20',
  },
];

// 状态配置
const stratStatusConfig: Record<string, { color: string; text: string; icon: React.ReactNode }> = {
  running: { color: 'green', text: '运行中', icon: <SyncOutlined spin /> },
  paused: { color: 'orange', text: '已暂停', icon: <PauseCircleOutlined /> },
  testing: { color: 'blue', text: '测试中', icon: <ExperimentOutlined /> },
  draft: { color: 'default', text: '草稿', icon: <EditOutlined /> },
};

export default function RecommendationPage() {
  const [detailDrawerVisible, setDetailDrawerVisible] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);

  const scenarios = [...new Set(mockStrategies.map(s => s.scene))];
  const totalScenarios = scenarios.length;
  const avgCtr = (mockStrategies.reduce((sum, s) => s.status === 'running' ? sum + s.ctr : sum, 0) / mockStrategies.filter(s => s.status === 'running').length).toFixed(2);
  const avgConversion = (mockStrategies.reduce((sum, s) => sum + s.conversionRate, 0) / mockStrategies.length).toFixed(2);
  const totalCoverage = (mockStrategies.reduce((sum, s) => sum + s.coverage, 0) / mockStrategies.length).toFixed(1);
  const totalAbTests = mockStrategies.reduce((sum, s) => sum + s.abTests, 0);

  const columns = [
    {
      title: '推荐策略', key: 'strategy', width: 250,
      render: (_: any, r: any) => (<div className="flex items-center gap-3"><div className="w-11 h-11 rounded-lg bg-gradient-to-br from-pink-100 to-rose-200 flex items-center justify-center text-rose-600"><BarChartOutlined style={{ fontSize: 20 }} /></div><div><div className="font-semibold text-sm">{r.name}</div><div className="text-xs text-gray-400">{r.algorithm}</div></div></div>),
    },
    { title: '应用场景', dataIndex: 'scene', key: 'scene', width: 100, render: (s: string) => <Tag color="purple">{s}</Tag> },
    { title: 'CTR', dataIndex: 'ctr', key: 'ctr', width: 80, align: 'right', render: (v: number) => <span className={v >= 6 ? 'text-green-600 font-bold' : v >= 4 ? 'text-blue-600' : 'text-orange-500'}>{v}%</span> },
    { title: '转化率', dataIndex: 'conversionRate', key: 'conversionRate', width: 90, align: 'right', render: (v: number) => <span className={v >= 5 ? 'text-green-600 font-bold' : v >= 2 ? 'text-blue-600' : 'text-gray-500'}>{v}%</span> },
    { title: '覆盖率', dataIndex: 'coverage', key: 'coverage', width: 100, render: (v: number) => <Progress percent={Math.round(v)} size="small" strokeColor={v >= 80 ? '#16A34A' : v >= 50 ? '#1677FF' : '#F59E0B'} format={p => `${p}%`} /> },
    { title: 'AB测试', dataIndex: 'abTests', key: 'abTests', width: 80, align: 'center', render: (n: number) => n > 0 ? <Badge count={n} style={{ backgroundColor: '#7C3AED' }} /> : <span className="text-gray-400">-</span> },
    { title: '状态', dataIndex: 'status', key: 'status', width: 90, render: (st: string) => { const c = stratStatusConfig[st]; return c ? <Tag color={c.color} icon={c.icon}>{c.text}</Tag> : st; } },
    { title: '操作', key: 'actions', width: 120, render: (_: any, r: any) => (<Space size="small"><Tooltip title="详情"><Button type="text" size="small" icon={<EyeOutlined />} onClick={() => { setSelectedStrategy(r); setDetailDrawerVisible(true); }} /></Tooltip><Tooltip title="编辑"><Button type="text" size="small" icon={<EditOutlined />} className="text-blue-500" /></Tooltip></Space>) },
  ];

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3"><BarChartOutlined className="text-2xl text-blue-600" /><h1 className="text-2xl font-bold m-0">智能推荐</h1></div>
          <Space><Button icon={<ExperimentOutlined />}>A/B实验台</Button><Button type="primary" icon={<PlusOutlined />}>新建策略</Button></Space>
        </div>

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}><DataCard title="推荐场景" value={totalScenarios} icon={<FireOutlined />} color="#DC2626" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="平均CTR" value={`${avgCtr}%`} icon={<RiseOutlined />} color="#16A34A" suffix="%" trend="up" trendValue="+0.3%" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="平均转化率" value={`${avgConversion}%`} icon={<PercentageOutlined />} color="#1677FF" suffix="%" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="覆盖用户" value={`${totalCoverage}%`} icon={<TeamOutlined />} color="#7C3AED" suffix="%" /></Col>
          <Col xs={24} sm={12} md={6}><DataCard title="AB测试数" value={totalAbTests} icon={<ExperimentOutlined />} color="#F59E0B" description="进行中" /></Col>
        </Row>

        <DataTable columns={columns as any} dataSource={mockStrategies} rowKey="id" title="推荐策略列表" showSearch searchPlaceholder="搜索策略名称或算法..." showFilter filterOptions={[{ label: '全部状态', value: '' }, ...Object.entries(stratStatusConfig).map(([k, v]) => ({ label: v.text, value: k }))]} pagination={{ pageSize: 8, showTotal: (t) => `共 ${t} 个策略` }} />

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title={<span><LineChartOutlined /> 效果指标概览</span>} className="shadow-sm" size="small">
              <div className="space-y-4">
                <div><div className="flex justify-between mb-1"><span className="text-sm">CTR 分布</span><span className="text-xs text-gray-400">越高越好</span></div><Progress percent={Math.round(parseFloat(avgCtr) * 10)} strokeColor="#16A34A" status="active" format={p => `${(p / 10).toFixed(2)}% 平均`} /></div>
                <div><div className="flex justify-between mb-1"><span className="text-sm">转化率分布</span><span className="text-xs text-gray-400">越高越好</span></div><Progress percent={Math.round(parseFloat(avgConversion) * 10)} strokeColor="#1677FF" status="active" format={p => `${(p / 10).toFixed(2)}% 平均`} /></div>
                <div><div className="flex justify-between mb-1"><span className="text-sm">覆盖率分布</span><span className="text-xs text-gray-400">覆盖面广</span></div><Progress percent={Math.round(parseFloat(totalCoverage))} strokeColor="#7C3AED" status="active" format={p => `${p}% 平均`} /></div>
              </div>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title={<span><SafetyCertificateOutlined /> 场景健康度</span>} className="shadow-sm" size="small">
              <div className="space-y-2">
                {scenarios.slice(0, 5).map(scene => {
                  const strat = mockStrategies.find(s => s.scene === scene);
                  if (!strat) return null;
                  return (
                    <div key={scene} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <Space><Tag color="purple">{scene}</Tag><span className="text-sm font-medium">{strat.name}</span></Space>
                      <Space>
                        <span className="text-xs">CTR <Text strong className="text-green-600">{strat.ctr}%</Text></span>
                        {(() => { const c = stratStatusConfig[strat.status]; return c ? <Tag color={c.color} className="!text-xs">{c.text}</Tag> : null; })()}
                      </Space>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Col>
        </Row>

        <Modal title={`策略详情 - ${selectedStrategy?.name}`} open={detailDrawerVisible} onCancel={() => setDetailDrawerVisible(false)} width={700} footer={[<Button key="close" onClick={() => setDetailDrawerVisible(false)}>关闭</Button>, <Button key="edit" type="primary" icon={<EditOutlined />}>编辑策略</Button>]}>
          {selectedStrategy && (
            <div className="space-y-4">
              <Descriptions column={2} size="small" bordered>
                <Descriptions.Item label="策略ID"><Text code>{selectedStrategy.id}</Text></Descriptions.Item>
                <Descriptions.Item label="状态">{(() => { const c = stratStatusConfig[selectedStrategy.status]; return c ? <Tag color={c.color} icon={c.icon}>{c.text}</Tag> : selectedStrategy.status; })()}</Descriptions.Item>
                <Descriptions.Item label="应用场景"><Tag color="purple">{selectedStrategy.scene}</Tag></Descriptions.Item>
                <Descriptions.Item label="算法模型"><Text code>{selectedStrategy.algorithm}</Text></Descriptions.Item>
                <Descriptions.Item label="CTR"><Text strong className="text-green-600">{selectedStrategy.ctr}%</Text></Descriptions.Item>
                <Descriptions.Item label="转化率"><Text strong className="text-blue-600">{selectedStrategy.conversionRate}%</Text></Descriptions.Item>
                <Descriptions.Item label="覆盖率"><Progress percent={Math.round(selectedStrategy.coverage)} size="small" style={{ maxWidth: 200 }} /></Descriptions.Item>
                <Descriptions.Item label="AB实验数">{selectedStrategy.abTests > 0 ? `${selectedStrategy.abTests} 个` : '无'}</Descriptions.Item>
                <Descriptions.Item label="最后更新">{selectedStrategy.lastUpdated}</Descriptions.Item>
              </Descriptions>
              <Divider orientation="left">核心特性</Divider>
              <div className="flex flex-wrap gap-2">{selectedStrategy.features.map((f: string) => <Tag key={f} color="blue" className="!px-3 !py-1 !rounded-full">{f}</Tag>)}</div>
              <Divider orientation="left">描述</Divider>
              <Paragraph className="bg-gray-50 p-4 rounded-lg mb-0">{selectedStrategy.description}</Paragraph>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}

import { SyncOutlined, PauseCircleOutlined } from '@ant-design/icons';
