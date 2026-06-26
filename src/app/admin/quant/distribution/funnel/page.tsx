'use client';

import { useState } from 'react';
import {
  Button,
  Space,
  Tag,
  Modal,
  message,
  Select,
  Table,
  Card,
  Progress,
  Tooltip,
  Divider,
  Descriptions,
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  FunnelPlotOutlined,
  ThunderboltOutlined,
  UserOutlined,
  ClockCircleOutlined,
  RiseOutlined,
  FallOutlined,
  LineChartOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

const { Option } = Select;

interface FunnelStage {
  id: string;
  stageName: string;
  visitorCount: number;
  conversionRate: number;
  dropOffCount: number;
  dropOffReasons: string[];
  avgTimeSpentSec: number;
  sourceBreakdown: { organic: number; paid: number; referral: number; direct: number };
  dateRange: string;
  comparisonWithPrev: number;
}

const mockFunnelData: FunnelStage[] = [
  {
    id: '1',
    stageName: 'landing',
    visitorCount: 125000,
    conversionRate: 100,
    dropOffCount: 0,
    dropOffReasons: [],
    avgTimeSpentSec: 45,
    sourceBreakdown: { organic: 45000, paid: 35000, referral: 25000, direct: 20000 },
    dateRange: '2024-06',
    comparisonWithPrev: 12.5,
  },
  {
    id: '2',
    stageName: 'signup',
    visitorCount: 42500,
    conversionRate: 34.0,
    dropOffCount: 82500,
    dropOffReasons: ['注册流程复杂', '手机号验证失败', '页面加载慢'],
    avgTimeSpentSec: 120,
    sourceBreakdown: { organic: 15200, paid: 11900, referral: 8500, direct: 6900 },
    dateRange: '2024-06',
    comparisonWithPrev: 8.2,
  },
  {
    id: '3',
    stageName: 'trial',
    visitorCount: 18500,
    conversionRate: 43.5,
    dropOffCount: 24000,
    dropOffReasons: ['不需要试用', '担心资金安全', '对比竞品'],
    avgTimeSpentSec: 280,
    sourceBreakdown: { organic: 6660, paid: 5180, referral: 3700, direct: 2960 },
    dateRange: '2024-06',
    comparisonWithPrev: -2.1,
  },
  {
    id: '4',
    stageName: 'deposit',
    visitorCount: 8200,
    conversionRate: 44.3,
    dropOffCount: 10300,
    dropOffReasons: ['最低投资额高', '支付方式限制', 'KYC审核等待'],
    avgTimeSpentSec: 420,
    sourceBreakdown: { organic: 2952, paid: 2296, referral: 1640, direct: 1312 },
    dateRange: '2024-06',
    comparisonWithPrev: 15.6,
  },
  {
    id: '5',
    stageName: 'first_trade',
    visitorCount: 3600,
    conversionRate: 43.9,
    dropOffCount: 4600,
    dropOffReasons: ['界面不熟悉', '犹豫观望', '技术问题'],
    avgTimeSpentSec: 600,
    sourceBreakdown: { organic: 1296, paid: 1008, referral: 720, direct: 576 },
    dateRange: '2024-06',
    comparisonWithPrev: 22.3,
  },
  {
    id: '6',
    stageName: 'renewal',
    visitorCount: 2100,
    conversionRate: 58.3,
    dropOffCount: 1500,
    dropOffReasons: ['收益未达预期', '找到替代方案', '资金周转'],
    avgTimeSpentSec: 180,
    sourceBreakdown: { organic: 756, paid: 588, referral: 420, direct: 336 },
    dateRange: '2024-06',
    comparisonWithPrev: 5.8,
  },
  {
    id: '7',
    stageName: 'referral',
    visitorCount: 1200,
    conversionRate: 57.1,
    dropOffCount: 900,
    dropOffReasons: ['无推荐激励', '社交圈有限', '隐私顾虑'],
    avgTimeSpentSec: 90,
    sourceBreakdown: { organic: 432, paid: 336, referral: 240, direct: 192 },
    dateRange: '2024-06',
    comparisonWithPrev: -8.5,
  },
  {
    id: '8',
    stageName: 'loyal',
    visitorCount: 685,
    conversionRate: 57.1,
    dropOffCount: 515,
    dropOffReasons: ['市场波动', '个人原因', '平台迁移'],
    avgTimeSpentSec: 1440,
    sourceBreakdown: { organic: 247, paid: 191, referral: 137, direct: 110 },
    dateRange: '2024-06',
    comparisonWithPrev: 18.2,
  },
];

const stageConfig: Record<string, { label: string; color: string }> = {
  landing: { label: '落地页访问', color: '#1677FF' },
  signup: { label: '用户注册', color: '#16A34A' },
  trial: { label: '免费试用', color: '#7C3AED' },
  deposit: { label: '首次入金', color: '#F59E0B' },
  first_trade: { label: '首次交易', color: '#F0B90B' },
  renewal: { label: '续费订阅', color: '#EC4899' },
  referral: { label: '推荐好友', color: '#06B6D4' },
  loyal: { label: '忠诚用户', color: '#DC2626' },
};

export default function DistributionFunnelPage() {
  const [selectedStage, setSelectedStage] = useState<FunnelStage | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterTimeRange, setFilterTimeRange] = useState<string>('');
  const [filterSource, setFilterSource] = useState<string>('');

  const filteredData = mockFunnelData.filter((stage) => {
    if (filterTimeRange && stage.dateRange !== filterTimeRange) return false;
    return true;
  });

  const totalVisitors = mockFunnelData[0].visitorCount;
  const overallConversion = ((mockFunnelData[mockFunnelData.length - 1].visitorCount / totalVisitors) * 100).toFixed(2);
  const funnelConversion = `${((mockFunnelData[3].visitorCount / mockFunnelData[1].visitorCount) * 100).toFixed(1)}%`;
  const avgTimeSpent = Math.round(
    mockFunnelData.reduce((sum, s) => sum + s.avgTimeSpentSec, 0) / mockFunnelData.length
  );
  const avgComparison = (
    mockFunnelData.reduce((sum, s) => sum + s.comparisonWithPrev, 0) / mockFunnelData.length
  ).toFixed(1);

  const columns = [
    {
      title: '漏斗阶段',
      dataIndex: 'stageName',
      key: 'stageName',
      render: (name: string) => (
        <Tag color={stageConfig[name]?.color} style={{ fontWeight: 600 }}>
          {stageConfig[name]?.label || name}
        </Tag>
      ),
    },
    {
      title: '访客数',
      dataIndex: 'visitorCount',
      key: 'visitorCount',
      render: (val: number) => <span className="font-semibold">{val.toLocaleString()}</span>,
    },
    {
      title: '转换率',
      dataIndex: 'conversionRate',
      key: 'conversionRate',
      render: (val: number) => (
        <Tooltip title={`转化率: ${val}%`}>
          <Progress
            percent={Math.min(val, 100)}
            size="small"
            style={{ width: 100 }}
            strokeColor={val >= 50 ? '#52c41a' : val >= 30 ? '#faad14' : '#ff4d4f'}
            format={(percent) => `${percent?.toFixed(1)}%`}
          />
        </Tooltip>
      ),
    },
    {
      title: '流失数',
      dataIndex: 'dropOffCount',
      key: 'dropOffCount',
      render: (val: number) => (
        <span className={val > 5000 ? 'text-red-600 font-semibold' : ''}>
          {val.toLocaleString()}
        </span>
      ),
    },
    {
      title: '主要流失原因',
      dataIndex: 'dropOffReasons',
      key: 'dropOffReasons',
      render: (reasons: string[]) => (
        <span className="text-xs text-gray-500">
          {reasons.slice(0, 2).join('、') || '-'}
        </span>
      ),
    },
    {
      title: '平均停留(秒)',
      dataIndex: 'avgTimeSpentSec',
      key: 'avgTimeSpentSec',
      render: (val: number) => (
        <Space>
          <ClockCircleOutlined style={{ color: '#7C3AED' }} />
          <span>{val}s</span>
        </Space>
      ),
    },
    {
      title: '自然流量',
      dataIndex: ['sourceBreakdown', 'organic'],
      key: 'organic',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '付费流量',
      dataIndex: ['sourceBreakdown', 'paid'],
      key: 'paid',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '推荐流量',
      dataIndex: ['sourceBreakdown', 'referral'],
      key: 'referral',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '直接访问',
      dataIndex: ['sourceBreakdown', 'direct'],
      key: 'direct',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '对比上期%',
      dataIndex: 'comparisonWithPrev',
      key: 'comparisonWithPrev',
      render: (val: number) => (
        <span
          style={{
            color: val >= 0 ? '#16A34A' : '#DC2626',
            fontWeight: 600,
          }}
        >
          {val >= 0 ? '+' : ''}
          {val}%
          {val >= 0 ? <RiseOutlined style={{ marginLeft: 4 }} /> : <FallOutlined style={{ marginLeft: 4 }} />}
        </span>
      ),
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '详情',
      icon: <EyeOutlined />,
      onClick: (record: FunnelStage) => {
        setSelectedStage(record);
        setDetailModalOpen(true);
      },
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold m-0 flex items-center gap-3">
              <FunnelPlotOutlined style={{ color: '#F0B90B' }} />
              转化漏斗分析
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              全链路转化追踪 · 获客→激活→付费→留存 · AIOPC漏斗优化建议
            </p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => message.success('数据已刷新')}>
              刷新
            </Button>
            <Button type="primary" icon={<ThunderboltOutlined />}>
              AIOPC优化建议
            </Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard
            title="总访客数"
            value={totalVisitors.toLocaleString()}
            icon={<UserOutlined />}
            color="#1677FF"
            description="本月独立访客"
          />
          <DataCard
            title="整体转化率"
            value={`${overallConversion}%`}
            icon={<LineChartOutlined />}
            color="#16A34A"
            description="落地页→忠诚用户"
          />
          <DataCard
            title="注册→付费漏斗"
            value={funnelConversion}
            icon={<FunnelPlotOutlined />}
            color="#7C3AED"
            description="核心转化路径"
          />
          <DataCard
            title="平均停留时间"
            value={`${avgTimeSpent}s`}
            icon={<ClockCircleOutlined />}
            color="#F59E0B"
            description="全阶段均值"
          />
          <DataCard
            title="环比变化"
            value={`${avgComparison}%`}
            prefix={parseFloat(avgComparison) >= 0 ? '+' : ''}
            icon={
              parseFloat(avgComparison) >= 0 ? (
                <RiseOutlined />
              ) : (
                <FallOutlined />
              )
            }
            color={parseFloat(avgComparison) >= 0 ? '#16A34A' : '#DC2626'}
            description="较上月变化"
          />
        </div>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap>
            <Select
              placeholder="时间范围"
              style={{ width: 160 }}
              allowClear
              value={filterTimeRange || undefined}
              onChange={setFilterTimeRange}
            >
              <Option value="2024-06">2024年6月</Option>
              <Option value="2024-05">2024年5月</Option>
              <Option value="2024-Q2">2024 Q2</Option>
              <Option value="2024-H1">2024上半年</Option>
            </Select>
            <Select
              placeholder="来源渠道"
              style={{ width: 140 }}
              allowClear
              value={filterSource || undefined}
              onChange={setFilterSource}
            >
              <Option value="organic">自然流量</Option>
              <Option value="paid">付费广告</Option>
              <Option value="referral">用户推荐</Option>
              <Option value="direct">直接访问</Option>
            </Select>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable
          columns={columns as any}
          dataSource={filteredData as any}
          rowKey="id"
          actions={actions}
          showSearch={false}
          showAdd={false}
        />

        {/* 详情弹窗 */}
        <Modal
          title={
            <span>
              漏斗阶段详情 -{' '}
              <span style={{ color: '#F0B90B' }}>
                {selectedStage ? stageConfig[selectedStage.stageName]?.label : ''}
              </span>
            </span>
          }
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>
              关闭
            </Button>,
            <Button key="optimize" type="primary" icon={<ThunderboltOutlined />}>
              查看优化方案
            </Button>,
          ]}
          width={800}
        >
          {selectedStage && (
            <div className="space-y-6">
              {/* 阶段概览 */}
              <Divider orientation="left">阶段概览</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="阶段名称">
                  <Tag color={stageConfig[selectedStage.stageName]?.color} style={{ fontWeight: 600 }}>
                    {stageConfig[selectedStage.stageName]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="统计周期">{selectedStage.dateRange}</Descriptions.Item>
                <Descriptions.Item label="访客数量">
                  <span className="text-xl font-bold">{selectedStage.visitorCount.toLocaleString()}</span>
                </Descriptions.Item>
                <Descriptions.Item label="转化率">
                  <span
                    className="text-xl font-bold"
                    style={{
                      color:
                        selectedStage.conversionRate >= 50
                          ? '#16A34A'
                          : selectedStage.conversionRate >= 30
                          ? '#F59E0B'
                          : '#DC2626',
                    }}
                  >
                    {selectedStage.conversionRate}%
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="流失数量">
                  <span className="text-red-600 font-semibold">
                    {selectedStage.dropOffCount.toLocaleString()}人
                  </span>
                </Descriptions.Item>
                <Descriptions.Item label="平均停留时间">
                  {selectedStage.avgTimeSpentSec}秒
                </Descriptions.Item>
                <Descriptions.Item label="环比变化">
                  <span
                    style={{
                      color: selectedStage.comparisonWithPrev >= 0 ? '#16A34A' : '#DC2626',
                      fontWeight: 600,
                    }}
                  >
                    {selectedStage.comparisonWithPrev >= 0 ? '+' : ''}
                    {selectedStage.comparisonWithPrev}%
                  </span>
                </Descriptions.Item>
              </Descriptions>

              {/* 流量来源分布 */}
              <Divider orientation="left">流量来源分布</Divider>
              <Card size="small">
                <Space direction="vertical" className="w-full" size="middle">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">自然搜索 (Organic)</span>
                      <span className="text-sm font-semibold">
                        {selectedStage.sourceBreakdown.organic.toLocaleString()} ({((selectedStage.sourceBreakdown.organic / selectedStage.visitorCount) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <Progress
                      percent={Math.round((selectedStage.sourceBreakdown.organic / selectedStage.visitorCount) * 100)}
                      strokeColor="#1677FF"
                      showInfo={false}
                      size="small"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">付费广告 (Paid)</span>
                      <span className="text-sm font-semibold">
                        {selectedStage.sourceBreakdown.paid.toLocaleString()} ({((selectedStage.sourceBreakdown.paid / selectedStage.visitorCount) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <Progress
                      percent={Math.round((selectedStage.sourceBreakdown.paid / selectedStage.visitorCount) * 100)}
                      strokeColor="#F59E0B"
                      showInfo={false}
                      size="small"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">用户推荐 (Referral)</span>
                      <span className="text-sm font-semibold">
                        {selectedStage.sourceBreakdown.referral.toLocaleString()} ({((selectedStage.sourceBreakdown.referral / selectedStage.visitorCount) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <Progress
                      percent={Math.round((selectedStage.sourceBreakdown.referral / selectedStage.visitorCount) * 100)}
                      strokeColor="#16A34A"
                      showInfo={false}
                      size="small"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">直接访问 (Direct)</span>
                      <span className="text-sm font-semibold">
                        {selectedStage.sourceBreakdown.direct.toLocaleString()} ({((selectedStage.sourceBreakdown.direct / selectedStage.visitorCount) * 100).toFixed(1)}%)
                      </span>
                    </div>
                    <Progress
                      percent={Math.round((selectedStage.sourceBreakdown.direct / selectedStage.visitorCount) * 100)}
                      strokeColor="#7C3AED"
                      showInfo={false}
                      size="small"
                    />
                  </div>
                </Space>
              </Card>

              {/* 流失原因分析 */}
              <Divider orientation="left">流失原因分析</Divider>
              {selectedStage.dropOffReasons.length > 0 ? (
                <Table
                  size="small"
                  pagination={false}
                  dataSource={selectedStage.dropOffReasons.map((reason, idx) => ({
                    key: idx,
                    reason,
                    impact: ['高', '中', '低'][idx % 3],
                    suggestion: [
                      '简化注册流程，减少必填项',
                      '优化页面加载速度至<2秒',
                      '增加信任背书和案例展示',
                      '降低最低入金额门槛',
                      '提供更多支付方式选项',
                    ][idx % 5],
                  }))}
                  columns={[
                    { title: '流失原因', dataIndex: 'reason', key: 'reason' },
                    {
                      title: '影响程度',
                      dataIndex: 'impact',
                      key: 'impact',
                      render: (val: string) => (
                        <Tag color={val === '高' ? 'red' : val === '中' ? 'orange' : 'blue'}>
                          {val}
                        </Tag>
                      ),
                    },
                    { title: '优化建议', dataIndex: 'suggestion', key: 'suggestion' },
                  ]}
                />
              ) : (
                <Card size="small">
                  <p className="text-center text-gray-400">此阶段为漏斗入口，无流失数据</p>
                </Card>
              )}

              {/* AIOPC优化建议 */}
              <Divider orientation="left">
                <ThunderboltOutlined style={{ color: '#F0B90B' }} /> AIOPC智能优化建议
              </Divider>
              <Card
                style={{
                  background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFDF5 100%)',
                  borderColor: '#F0B90B',
                }}
                size="small"
              >
                <Space direction="vertical" className="w-full" size="small">
                  <div className="flex gap-3 p-3 bg-white rounded-lg">
                    <ThunderboltOutlined style={{ color: '#F0B90B', fontSize: 20 }} />
                    <div>
                      <div className="font-semibold mb-1">即时优化建议</div>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        <li>• 针对"{selectedStage.dropOffReasons[0] || '主要瓶颈'}"问题，建议A/B测试新流程</li>
                        <li>• 该阶段转化率{selectedStage.conversionRate >= 40 ? '高于' : '低于'}行业平均水平{(selectedStage.conversionRate * 1.2).toFixed(1)}%</li>
                        <li>• 推荐投放渠道：{Object.entries(selectedStage.sourceBreakdown).sort((a, b) => b[1] - a[1])[0][0]}效果最佳</li>
                      </ul>
                    </div>
                  </div>
                  <div className="flex gap-3 p-3 bg-white rounded-lg">
                    <LineChartOutlined style={{ color: '#1677FF', fontSize: 20 }} />
                    <div>
                      <div className="font-semibold mb-1">AB测试建议</div>
                      <ul className="text-sm text-gray-600 space-y-1 ml-4">
                        <li>• 测试方案A：简化当前流程步骤数从5步减至3步</li>
                        <li>• 测试方案B：增加社交证明元素（用户评价/案例）</li>
                        <li>• 预期提升：+{Math.round(selectedStage.conversionRate * 0.15)}% 转化率</li>
                      </ul>
                    </div>
                  </div>
                </Space>
              </Card>

              {/* 历史趋势 */}
              <Divider orientation="left">历史趋势</Divider>
              <Table
                size="small"
                pagination={false}
                dataSource={[
                  { period: '2024-06', visitors: selectedStage.visitorCount, rate: selectedStage.conversionRate, change: selectedStage.comparisonWithPrev },
                  { period: '2024-05', visitors: Math.round(selectedStage.visitorCount / (1 + selectedStage.comparisonWithPrev / 100)), rate: (selectedStage.conversionRate * 0.95).toFixed(1), change: 5.2 },
                  { period: '2024-04', visitors: Math.round(selectedStage.visitorCount / 1.12), rate: (selectedStage.conversionRate * 0.88).toFixed(1), change: -3.1 },
                  { period: '2024-03', visitors: Math.round(selectedStage.visitorCount / 1.08), rate: (selectedStage.conversionRate * 0.91).toFixed(1), change: 8.7 },
                ]}
                columns={[
                  { title: '周期', dataIndex: 'period', key: 'period' },
                  { title: '访客数', dataIndex: 'visitors', key: 'visitors', render: (v: number) => v.toLocaleString() },
                  { title: '转化率', dataIndex: 'rate', key: 'rate', render: (v: any) => `${v}%` },
                  {
                    title: '环比',
                    dataIndex: 'change',
                    key: 'change',
                    render: (v: number) => (
                      <span style={{ color: v >= 0 ? '#16A34A' : '#DC2626' }}>
                        {v >= 0 ? '+' : ''}{v}%
                      </span>
                    ),
                  },
                ]}
                rowKey="period"
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
