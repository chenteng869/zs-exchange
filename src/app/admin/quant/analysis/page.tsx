'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { Button, Space, Tag, Modal, message, Descriptions, Select, Table, Card, Tooltip, Progress, Row, Col, Alert } from 'antd';
import {
  LineChartOutlined,
  EyeOutlined,
  FilePdfOutlined,
  BellOutlined,
  InboxOutlined,
  DashboardOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
  WarningOutlined,
  CheckCircleOutlined,
  RobotOutlined,
  UserOutlined,
  RiseOutlined,
  FallOutlined,
  HistoryOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface AnalysisReport {
  id: string;
  reportName: string;
  targetSymbol: string;
  analysisType: 'technical' | 'fundamental' | 'sentiment' | 'flow' | 'composite';
  timeframe: '1h' | '4h' | '1d' | '1w';
  signals: { buy: number; sell: number; neutral: number };
  confidence: number;
  keyIndicators: Record<string, string>;
  conclusion: string;
  riskWarning: string;
  generatedAt: string;
  analyst: 'human' | 'aiopc' | 'hybrid';
  dataPoints: number;
}

const mockData: AnalysisReport[] = [
  {
    id: '1', reportName: 'BTC/USDT 多因子综合分析', targetSymbol: 'BTC/USDT', analysisType: 'composite',
    timeframe: '4h', signals: { buy: 7, sell: 2, neutral: 3 }, confidence: 85,
    keyIndicators: { RSI: '62.3', MACD: '看涨', MA20: '$67,200', Volume: '+15%' },
    conclusion: '技术面和资金面共振看涨，建议逢低布局，目标位$72,000',
    riskWarning: '关注美联储议息会议结果，可能引发短期波动', generatedAt: '2024-06-23 14:30', analyst: 'aiopc', dataPoints: 12500,
  },
  {
    id: '2', reportName: 'ETH 资金流向深度报告', targetSymbol: 'ETH/USDT', analysisType: 'flow',
    timeframe: '1d', signals: { buy: 5, sell: 4, neutral: 3 }, confidence: 68,
    keyIndicators: { NetFlow: '+$45M', ExchangeFlow: '-$12M', WhaleRatio: '0.32', ActiveAddr: '+8%' },
    conclusion: '大额资金持续流入，链上活跃度提升，中期偏多',
    riskWarning: 'DeFi TVL波动较大，需关注流动性风险', generatedAt: '2024-06-23 10:00', analyst: 'hybrid', dataPoints: 8900,
  },
  {
    id: '3', reportName: 'SOL 技术形态识别', targetSymbol: 'SOL/USDT', analysisType: 'technical',
    timeframe: '1h', signals: { buy: 6, sell: 5, neutral: 1 }, confidence: 55,
    keyIndicators: { Bollinger: '中轨上方', EMA: '多头排列', Support: '$145', Resistance: '$165' },
    conclusion: '短期震荡偏强，突破$160可追多，止损$148',
    riskWarning: '波动率处于高位，注意仓位管理', generatedAt: '2024-06-23 13:15', analyst: 'human', dataPoints: 3200,
  },
  {
    id: '4', reportName: '市场情绪指数追踪', targetSymbol: 'MARKET', analysisType: 'sentiment',
    timeframe: '4h', signals: { buy: 8, sell: 1, neutral: 3 }, confidence: 78,
    keyIndicators: { FearGreed: '72(贪婪)', SocialVol: '高', NewsSent: '正面', OptionsPCR: '0.65' },
    conclusion: '市场情绪偏向乐观，但贪婪指数偏高需警惕回调',
    riskWarning: '情绪极端时容易出现反转，不宜过度追高', generatedAt: '2024-06-23 11:45', analyst: 'aiopc', dataPoints: 15600,
  },
  {
    id: '5', reportName: 'BNB 基本面估值分析', targetSymbol: 'BNB/USDT', analysisType: 'fundamental',
    timeframe: '1w', signals: { buy: 4, sell: 3, neutral: 5 }, confidence: 52,
    keyIndicators: { PE: '28x', PB: '3.2x', BurnRate: '-2.1pct/Q', Revenue: '+35pct YoY' },
    conclusion: '估值合理偏贵，长期持有价值仍存，短线观望',
    riskWarning: '监管政策变化可能影响平台币估值逻辑', generatedAt: '2024-06-22 16:00', analyst: 'hybrid', dataPoints: 4500,
  },
  {
    id: '6', reportName: 'XRP 法律进展影响评估', targetSymbol: 'XRP/USDT', analysisType: 'composite',
    timeframe: '1d', signals: { buy: 9, sell: 1, neutral: 2 }, confidence: 92,
    keyIndicators: { LegalScore: 'A+', Institutional: '+++', Retail: '++', Correlation: '0.15' },
   conclusion: 'SEC诉讼利好推动，机构资金加速入场，强烈看多',
    riskWarning: '利好出尽风险，注意获利盘抛压', generatedAt: '2024-06-23 09:30', analyst: 'aiopc', dataPoints: 9800,
  },
  {
    id: '7', reportName: 'AVAX 生态发展跟踪', targetSymbol: 'AVAX/USDT', analysisType: 'fundamental',
    timeframe: '1w', signals: { buy: 3, sell: 4, neutral: 5 }, confidence: 48,
    keyIndicators: { TVL: '$2.1B', dApps: '+12', Partners: '+3', DevActivity: '高' },
    conclusion: '生态稳步发展但增速放缓，等待催化剂事件',
    riskWarning: '竞争对手L2生态分流效应明显', generatedAt: '2024-06-21 14:20', analyst: 'human', dataPoints: 6700,
  },
  {
    id: '8', reportName: 'MATIC 网络活动监测', targetSymbol: 'MATIC/USDT', analysisType: 'flow',
    timeframe: '4h', signals: { buy: 5, sell: 3, neutral: 4 }, confidence: 61,
    keyIndicators: { TPS: '85', GasPrice: '32 Gwei', BridgeVol: '$18M', StakingAPY: '5.2%' },
    conclusion: '网络活动稳定，跨桥资金流入增加，中性偏多',
    riskWarning: 'Polygon 2.0升级进度不及预期', generatedAt: '2024-06-23 08:00', analyst: 'aiopc', dataPoints: 11200,
  },
  {
    id: '9', reportName: 'DOGE 社交热度分析', targetSymbol: 'DOGE/USDT', analysisType: 'sentiment',
    timeframe: '1h', signals: { buy: 6, sell: 6, neutral: 0 }, confidence: 50,
    keyIndicators: { TwitterTrend: '#3', Reddit: '热门', TikTok: '爆火', Influencer: '积极' },
    conclusion: '社交媒体热度极高，短期投机氛围浓厚，谨慎参与',
    riskWarning: ' meme币波动极大，仅适合极小仓位博弈', generatedAt: '2024-06-23 12:30', analyst: 'aiopc', dataPoints: 28000,
  },
  {
    id: '10', reportName: 'LINK 预言机需求预测', targetSymbol: 'LINK/USDT', analysisType: 'composite',
    timeframe: '1d', signals: { buy: 7, sell: 2, neutral: 3 }, confidence: 73,
    keyIndicators: { Feeds: '+15%', Revenue: '$8.2M/mo', Integrations: '+28', Secured: '$75B' },
    conclusion: '预言机需求持续增长，基本面强劲，中期看好',
    riskWarning: '竞争格局加剧，需关注新进入者', generatedAt: '2024-06-22 20:15', analyst: 'hybrid', dataPoints: 7600,
  },
];

const typeMap: Record<string, { label: string; color: string }> = {
  technical: { label: '技术面', color: '#1677FF' },
  fundamental: { label: '基本面', color: '#16A34A' },
  sentiment: { label: '情绪面', color: '#F59E0B' },
  flow: { label: '资金面', color: '#7C3AED' },
  composite: { label: '综合', color: '#EC4899' },
};

const analystMap: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  human: { label: '人工分析师', color: 'blue', icon: <UserOutlined /> },
  aiopc: { label: 'AIOPC引擎', color: '#F0B90B', icon: <RobotOutlined /> },
  hybrid: { label: '人机协同', color: 'purple', icon: <ThunderboltOutlined /> },
};

export default function AnalysisPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<AnalysisReport | null>(null);
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [timeframeFilter, setTimeframeFilter] = useState<string>('');
  const [analystFilter, setAnalystFilter] = useState<string>('');

  const filteredData = mockData.filter(item => {
    if (typeFilter && item.analysisType !== typeFilter) return false;
    if (timeframeFilter && item.timeframe !== timeframeFilter) return false;
    if (analystFilter && item.analyst !== analystFilter) return false;
    return true;
  });

  const totalReports = mockData.length;
  const todayReports = mockData.filter(i => dayjs(i.generatedAt).isSame(dayjs(), 'day')).length;
  const totalBuySignals = mockData.reduce((sum, i) => sum + i.signals.buy, 0);
  const avgConfidence = Math.round(mockData.reduce((sum, i) => sum + i.confidence, 0) / mockData.length);
  const aiopcCount = mockData.filter(i => i.analyst === 'aiopc').length;

  const actions: any[] = [
    {
      key: 'view',
      label: '查看详情',
      icon: <EyeOutlined />,
      onClick: (record: AnalysisReport) => {
        setSelectedReport(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'export',
      label: '导出PDF',
      icon: <FilePdfOutlined />,
      onClick: (record: AnalysisReport) => {
        message.success(`正在导出 "${record.reportName}" 为PDF`);
      },
    },
    {
      key: 'alert',
      label: '设置警报',
      icon: <BellOutlined />,
      onClick: (record: AnalysisReport) => {
        message.info(`为 "${record.targetSymbol}" 设置分析警报`);
      },
    },
    {
      key: 'archive',
      label: '归档',
      icon: <InboxOutlined />,
      onClick: (record: AnalysisReport) => {
        message.success(`报告 "${record.reportName}" 已归档`);
      },
    },
  ];

  const columns = [
    {
      title: '报告名',
      dataIndex: 'reportName',
      key: 'reportName',
      width: 220,
      render: (text: string) => <span className="font-semibold">{text}</span>,
    },
    {
      title: '标的',
      dataIndex: 'targetSymbol',
      key: 'targetSymbol',
      width: 110,
      render: (symbol: string) => <code className="text-sm">{symbol}</code>,
    },
    {
      title: '类型',
      dataIndex: 'analysisType',
      key: 'analysisType',
      width: 90,
      render: (type: string) => (
        <Tag color={typeMap[type]?.color}>{typeMap[type]?.label}</Tag>
      ),
    },
    {
      title: '时间框架',
      dataIndex: 'timeframe',
      key: 'timeframe',
      width: 80,
      render: (tf: string) => <Tag>{tf.toUpperCase()}</Tag>,
    },
    {
      title: '信号分布',
      dataIndex: 'signals',
      key: 'signals',
      width: 150,
      render: (signals: { buy: number; sell: number; neutral: number }) => (
        <Space size={4}>
          <Tag color="green">买{signals.buy}</Tag>
          <Tag color="red">卖{signals.sell}</Tag>
          <Tag color="default">中立{signals.neutral}</Tag>
        </Space>
      ),
    },
    {
      title: '置信度',
      dataIndex: 'confidence',
      key: 'confidence',
      width: 120,
      render: (conf: number) => (
        <Progress
          percent={conf}
          size="small"
          strokeColor={conf >= 80 ? '#16A34A' : conf >= 60 ? '#F59E0B' : '#DC2626'}
          format={() => `${conf}%`}
        />
      ),
    },
    {
      title: '关键指标',
      dataIndex: 'keyIndicators',
      key: 'keyIndicators',
      width: 180,
      ellipsis: true,
      render: (inds: Record<string, string>) => (
        <Tooltip title={Object.entries(inds).map(([k, v]) => `${k}: ${v}`).join(' | ')}>
          <span className="text-xs text-gray-600">
            {Object.entries(inds).slice(0, 2).map(([k, v]) => `${k}:${v}`).join(' | ')}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '结论',
      dataIndex: 'conclusion',
      key: 'conclusion',
      width: 250,
      ellipsis: true,
      render: (text: string) => <span className="text-sm">{text}</span>,
    },
    {
      title: '风险提示',
      dataIndex: 'riskWarning',
      key: 'riskWarning',
      width: 180,
      ellipsis: true,
      render: (warning: string) => (
        <Tooltip title={warning}>
          <span className="text-xs text-orange-600"><WarningOutlined /> {warning.slice(0, 20)}...</span>
        </Tooltip>
      ),
    },
    {
      title: '分析师',
      dataIndex: 'analyst',
      key: 'analyst',
      width: 100,
      render: (analyst: string) => {
        const config = analystMap[analyst];
        return (
          <Tag color={config?.color as any} icon={config?.icon}>
            {config?.label}
          </Tag>
        );
      },
    },
    {
      title: '数据点',
      dataIndex: 'dataPoints',
      key: 'dataPoints',
      width: 80,
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '生成时间',
      dataIndex: 'generatedAt',
      key: 'generatedAt',
      width: 150,
    },
  ];

  const mockHistory = [
    { id: 1, date: '2024-06-22', symbol: 'BTC/USDT', conf: 82, result: '准确' },
    { id: 2, date: '2024-06-21', symbol: 'ETH/USDT', conf: 71, result: '部分准确' },
    { id: 3, date: '2024-06-20', symbol: 'SOL/USDT', conf: 65, result: '偏差' },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <LineChartOutlined className="text-3xl" style={{ color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0">量化分析工作台</h1>
            <p className="text-gray-500 text-sm mt-1">
              多因子分析引擎 · 技术面/基本面/情绪面/资金面交叉验证 · AIOPC分析内核
            </p>
          </div>
        </div>

        {/* DataCards */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="分析报告总数"
              value={totalReports}
              suffix="份"
              icon={<DashboardOutlined />}
              color="#1677FF"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="今日新增"
              value={todayReports}
              suffix="份"
              icon={<RiseOutlined />}
              color="#16A34A"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="买入信号"
              value={totalBuySignals}
              suffix="个"
              icon={<CheckCircleOutlined />}
              color="#F59E0B"
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard
              title="平均置信度"
              value={avgConfidence}
              suffix="%"
              icon={<SafetyCertificateOutlined />}
              color="#7C3AED"
            />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap size="middle">
            <Select
              placeholder="分析类型"
              allowClear
              style={{ width: 130 }}
              value={typeFilter || undefined}
              onChange={setTypeFilter}
            >
              {Object.entries(typeMap).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
            </Select>
            <Select
              placeholder="时间框架"
              allowClear
              style={{ width: 120 }}
              value={timeframeFilter || undefined}
              onChange={setTimeframeFilter}
            >
              <Select.Option value="1h">1小时</Select.Option>
              <Select.Option value="4h">4小时</Select.Option>
              <Select.Option value="1d">日线</Select.Option>
              <Select.Option value="1w">周线</Select.Option>
            </Select>
            <Select
              placeholder="分析师"
              allowClear
              style={{ width: 130 }}
              value={analystFilter || undefined}
              onChange={setAnalystFilter}
            >
              {Object.entries(analystMap).map(([key, { label }]) => (
                <Select.Option key={key} value={key}>{label}</Select.Option>
              ))}
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

        {/* 详情 Modal */}
        <Modal
          title={`分析报告详情 - ${selectedReport?.reportName || ''}`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={880}
        >
          {selectedReport && (
            <div className="space-y-6">
              {/* 报告概览 */}
              <Descriptions title="报告概览" bordered column={2} size="small">
                <Descriptions.Item label="报告名称" span={2}>{selectedReport.reportName}</Descriptions.Item>
                <Descriptions.Item label="标的资产">
                  <code className="text-base">{selectedReport.targetSymbol}</code>
                </Descriptions.Item>
                <Descriptions.Item label="分析类型">
                  <Tag color={typeMap[selectedReport.analysisType]?.color}>
                    {typeMap[selectedReport.analysisType]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="时间框架">{selectedReport.timeframe.toUpperCase()}</Descriptions.Item>
                <Descriptions.Item label="分析师">
                  <Tag color={analystMap[selectedReport.analyst]?.color as any} icon={analystMap[selectedReport.analyst]?.icon}>
                    {analystMap[selectedReport.analyst]?.label}
                  </Tag>
                </Descriptions.Item>
                <Descriptions.Item label="生成时间">{selectedReport.generatedAt}</Descriptions.Item>
                <Descriptions.Item label="数据点数" span={2}>{selectedReport.dataPoints.toLocaleString()} 个数据源</Descriptions.Item>
              </Descriptions>

              {/* 信号明细 */}
              <Card title="信号分布" size="small">
                <Row gutter={[16, 12]}>
                  <Col span={8}>
                    <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                      <RiseOutlined style={{ fontSize: 24, color: '#16A34A' }} />
                      <div className="text-2xl font-bold text-green-600 mt-2">{selectedReport.signals.buy}</div>
                      <div className="text-sm text-gray-500">买入信号</div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
                      <FallOutlined style={{ fontSize: 24, color: '#DC2626' }} />
                      <div className="text-2xl font-bold text-red-600 mt-2">{selectedReport.signals.sell}</div>
                      <div className="text-sm text-gray-500">卖出信号</div>
                    </div>
                  </Col>
                  <Col span={8}>
                    <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="text-2xl font-bold text-gray-600 mt-2">{selectedReport.signals.neutral}</div>
                      <div className="text-sm text-gray-500">中立信号</div>
                    </div>
                  </Col>
                </Row>
              </Card>

              {/* AIOPC分析质量 */}
              <Card
                title={
                  <span>
                    <ThunderboltOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                    AIOPC分析质量评估
                  </span>
                }
                size="small"
                style={{ borderColor: '#F0B90B' }}
              >
                <Row gutter={[16, 12]}>
                  {[
                    { label: '数据完整性', score: 95, color: '#1677FF' },
                    { label: '模型准确性', score: selectedReport.confidence, color: '#16A34A' },
                    { label: '时效性', score: 88, color: '#F59E0B' },
                    { label: '可解释性', score: 76, color: '#7C3AED' },
                    { label: '稳定性', score: 82, color: '#EC4899' },
                  ].map(item => (
                    <Col xs={24} sm={12} md={8} lg={4} key={item.label}>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <div className="text-sm text-gray-500 mb-1">{item.label}</div>
                        <Progress
                          percent={item.score}
                          strokeColor={item.color}
                          format={(percent) => <span style={{ color: item.color }}>{percent}</span>}
                          size={48}
                        />
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card>

              {/* 关键指标与结论 */}
              <Descriptions title="关键指标" bordered column={2} size="small">
                {Object.entries(selectedReport.keyIndicators).map(([key, val]) => (
                  <Descriptions.Item key={key} label={key}>
                    <span className="font-mono font-semibold">{val}</span>
                  </Descriptions.Item>
                ))}
              </Descriptions>

              <Card
                title="分析结论"
                size="small"
                className={selectedReport.conclusion.includes('看多') || selectedReport.conclusion.includes('看好') ? 'border-l-4 border-l-green-500' : ''}
              >
                <p className="text-base m-0">{selectedReport.conclusion}</p>
              </Card>

              {/* 风险警告 */}
              {selectedReport.riskWarning && (
                <Alert
                  message="风险提示"
                  description={selectedReport.riskWarning}
                  type="warning"
                  showIcon
                  icon={<WarningOutlined />}
                />
              )}

              {/* 历史报告对比 */}
              <Table
                dataSource={mockHistory}
                rowKey="id"
                size="small"
                pagination={false}
                title={() => <span><HistoryOutlined /> 历史报告对比</span>}
                columns={[
                  { title: '日期', dataIndex: 'date', width: 110 },
                  { title: '标的', dataIndex: 'symbol', render: (s: string) => <code>{s}</code>, width: 110 },
                  { title: '置信度', dataIndex: 'conf', width: 90, render: (c: number) => `${c}%` },
                  { title: '验证结果', dataIndex: 'result', render: (r: string) => r === '准确' ? <Tag color="success">✓ 准确</Tag> : r === '部分准确' ? <Tag color="processing">△ 部分</Tag> : <Tag color="error">✗ 偏差</Tag> },
                ]}
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
