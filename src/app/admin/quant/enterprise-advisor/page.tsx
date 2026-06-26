'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { Button, Space, Tag, Modal, message, Select, Table, Card, Progress, Tooltip, Divider, Descriptions } from 'antd';
import { SearchOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, ExportOutlined, TagOutlined, QuestionCircleOutlined, RobotOutlined, ClockCircleOutlined, ThunderboltOutlined, LikeOutlined, DislikeOutlined, StarFilled as StarIcon } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

const { Option } = Select;

interface AdvisorSession {
  id: string;
  sessionId: string;
  userQuery: string;
  aiResponse: string;
  category: 'portfolio_allocation' | 'market_analysis' | 'stock_picking' | 'risk_management' | 'tax_optimization';
  sources: number;
  confidence: number;
  feedback: 'positive' | 'negative' | 'neutral';
  followUpQuestions: number;
  modelVersion: string;
  responseTokens: number;
  latencyMs: number;
  timestamp: string;
}

const mockSessions: AdvisorSession[] = [
  { id: '1', sessionId: 'SES-20240623-001', userQuery: '当前市场环境下，如何配置60/40投资组合？', aiResponse: '建议采用核心-卫星策略，60%配置于多元化股票指数基金，40%分配至债券和另类资产...', category: 'portfolio_allocation', sources: 5, confidence: 92, feedback: 'positive', followUpQuestions: 2, modelVersion: 'GPT-4o-v2', responseTokens: 485, latencyMs: 1200, timestamp: '2024-06-23T10:30:00Z' },
  { id: '2', sessionId: 'SES-20240623-002', userQuery: '英伟达财报后股价走势如何判断？', aiResponse: '基于技术面和基本面综合分析，NVIDIA短期面临获利回吐压力，但长期AI算力需求支撑估值...', category: 'stock_picking', sources: 8, confidence: 85, feedback: 'neutral', followUpQuestions: 1, modelVersion: 'GPT-4o-v2', responseTokens: 620, latencyMs: 1800, timestamp: '2024-06-23T09:45:00Z' },
  { id: '3', sessionId: 'SES-20240622-003', userQuery: '加密货币市场是否适合现在入场？', aiResponse: '比特币ETF通过后机构资金持续流入，但需注意波动性风险。建议定投策略分批建仓...', category: 'market_analysis', sources: 12, confidence: 78, feedback: 'negative', followUpQuestions: 3, modelVersion: 'Claude-3.5-Sonnet', responseTokens: 720, latencyMs: 2100, timestamp: '2024-06-22T16:20:00Z' },
  { id: '4', sessionId: 'SES-20240622-004', userQuery: '高净值客户如何进行税务优化？', aiResponse: '针对高净值客户的税务优化策略包括：1)利用退休账户税收递延 2)慈善捐赠抵税 3)损失收割策略...', category: 'tax_optimization', sources: 6, confidence: 95, feedback: 'positive', followUpQuestions: 0, modelVersion: 'GPT-4o-v2', responseTokens: 890, latencyMs: 1500, timestamp: '2024-06-22T14:10:00Z' },
  { id: '5', sessionId: 'SES-20240621-005', userQuery: '我的组合最大回撤超过了15%，怎么办？', aiResponse: '首先不要恐慌性卖出。建议：1)评估风险敞口 2)增加对冲资产 3)重新平衡至目标配置...', category: 'risk_management', sources: 7, confidence: 90, feedback: 'positive', followUpQuestions: 2, modelVersion: 'Claude-3.5-Sonnet', responseTokens: 550, latencyMs: 1400, timestamp: '2024-06-21T11:30:00Z' },
  { id: '6', sessionId: 'SES-20240621-006', userQuery: '推荐几只具有成长性的科技股？', aiResponse: '基于AI驱动的量化筛选，以下公司值得关注：1)ASML(光刻机垄断) 2)AMD(AI芯片第二极)...', category: 'stock_picking', sources: 15, confidence: 72, feedback: 'neutral', followUpQuestions: 4, modelVersion: 'GPT-4o-v2', responseTokens: 980, latencyMs: 2500, timestamp: '2024-06-21T09:00:00Z' },
  { id: '7', sessionId: 'SES-20240620-007', userQuery: '美联储降息对债券市场有何影响？', aiResponse: '降息预期已部分计入价格，短端收益率将下行，利差收窄利好信用债。建议关注中短期高等级债券...', category: 'market_analysis', sources: 9, confidence: 88, feedback: 'positive', followUpQuestions: 1, modelVersion: 'Claude-3.5-Sonnet', responseTokens: 650, latencyMs: 1650, timestamp: '2024-06-20T15:45:00Z' },
  { id: '8', sessionId: 'SES-20240620-008', userQuery: '如何为子女设立教育金计划？', aiResponse: '教育金规划应考虑时间跨度(10-18年)、通胀因素和税务优惠。推荐529计划或保险型教育金产品...', category: 'portfolio_allocation', sources: 4, confidence: 93, feedback: 'positive', followUpQuestions: 0, modelVersion: 'GPT-4o-v2', responseTokens: 520, latencyMs: 1100, timestamp: '2024-06-20T13:20:00Z' },
  { id: '9', sessionId: 'SES-20240619-009', userQuery: '期权策略中的希腊字母如何理解？', aiResponse: 'Delta衡量价格敏感度，Gamma反映Delta变化速率，Theta代表时间衰减，Vega度量波动率影响...', category: 'risk_management', sources: 11, confidence: 96, feedback: 'positive', followUpQuestions: 3, modelVersion: 'Claude-3.5-Sonnet', responseTokens: 780, latencyMs: 1900, timestamp: '2024-06-19T16:50:00Z' },
  { id: '10', sessionId: 'SES-20240619-010', userQuery: 'ESG投资在当前环境下的表现如何？', aiResponse: 'ESG因子近年来表现分化，但长期来看治理(G)因子最稳定。建议选择真正有实质性ESG改进的公司...', category: 'market_analysis', sources: 18, confidence: 81, feedback: 'neutral', followUpQuestions: 2, modelVersion: 'GPT-4o-v2', responseTokens: 850, latencyMs: 2300, timestamp: '2024-06-19T10:15:00Z' },
];

const categoryConfig: Record<string, { label: string; color: string }> = {
  portfolio_allocation: { label: '资产配置', color: '#1677FF' },
  market_analysis: { label: '市场分析', color: '#16A34A' },
  stock_picking: { label: '选股策略', color: '#F59E0B' },
  risk_management: { label: '风险管理', color: '#DC2626' },
  tax_optimization: { label: '税务优化', color: '#7C3AED' },
};

const feedbackConfig: Record<string, { label: string; color: string; icon: any }> = {
  positive: { label: '好评', color: 'success', icon: <LikeOutlined /> },
  negative: { label: '差评', color: 'error', icon: <DislikeOutlined /> },
  neutral: { label: '中性', color: 'default', icon: null },
};

export default function EnterpriseAdvisorPage() {
  const [selectedSession, setSelectedSession] = useState<AdvisorSession | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterFeedback, setFilterFeedback] = useState<string>('');
  const [filterTimeRange, setFilterTimeRange] = useState<string>('');

  const filteredSessions = mockSessions.filter((s) => {
    if (filterCategory && s.category !== filterCategory) return false;
    if (filterFeedback && s.feedback !== filterFeedback) return false;
    return true;
  });

  const totalSessions = mockSessions.length;
  const todayCount = mockSessions.filter(s => dayjs(s.timestamp).isSame(dayjs(), 'day')).length;
  const avgConfidence = Math.round(mockSessions.reduce((sum, s) => sum + s.confidence, 0) / totalSessions);
  const positiveRate = Math.round((mockSessions.filter(s => s.feedback === 'positive').length / totalSessions) * 100);
  const avgLatency = Math.round(mockSessions.reduce((sum, s) => sum + s.latencyMs, 0) / totalSessions);

  const columns = [
    { title: '会话ID', dataIndex: 'sessionId', key: 'sessionId', render: (v: string) => <code className="font-mono text-xs">{v}</code>, width: 160 },
    { title: '用户问题', dataIndex: 'userQuery', key: 'userQuery', width: 220, ellipsis: true, render: (t: string) => <span className="text-sm"><QuestionCircleOutlined style={{ marginRight: 4 }} />{t}</span> },
    { title: 'AI回答', dataIndex: 'aiResponse', key: 'aiResponse', width: 200, ellipsis: true, render: (t: string) => <span className="text-xs text-gray-600">{t.substring(0, 80)}...</span> },
    { title: '类别', dataIndex: 'category', key: 'category', render: (c: string) => <Tag color={categoryConfig[c]?.color}>{categoryConfig[c]?.label}</Tag> },
    { title: '来源数', dataIndex: 'sources', key: 'sources', render: (v: number) => <Tag>{v}个</Tag> },
    { title: '置信度', dataIndex: 'confidence', key: 'confidence', render: (v: number) => <Progress percent={v} size="small" style={{ width: 70 }} strokeColor={v >= 90 ? '#52c41a' : v >= 80 ? '#faad14' : '#ff4d4f'} /> },
    { title: '反馈', dataIndex: 'feedback', key: 'feedback', render: (f: string) => <Tag color={feedbackConfig[f]?.color} icon={feedbackConfig[f]?.icon}>{feedbackConfig[f]?.label}</Tag> },
    { title: '追问数', dataIndex: 'followUpQuestions', key: 'followUpQuestions', render: (v: number) => v },
    { title: 'Token', dataIndex: 'responseTokens', key: 'responseTokens', render: (v: number) => v.toLocaleString() },
    { title: '延迟ms', dataIndex: 'latencyMs', key: 'latencyMs', render: (v: number) => <span style={{ color: v > 2000 ? '#DC2626' : '#16A34A' }}>{v}</span> },
    { title: '时间', dataIndex: 'timestamp', key: 'timestamp', render: (v: string) => dayjs(v).format('MM-DD HH:mm') },
  ];

  const actions: any[] = [
    { key: 'view', label: '详情', icon: <EyeOutlined />, onClick: (record: AdvisorSession) => { setSelectedSession(record); setDetailModalOpen(true); } },
    { key: 'export', label: '导出', icon: <ExportOutlined />, onClick: (record: AdvisorSession) => message.success(`导出会话: ${record.sessionId}`) },
    { key: 'rate', label: '标注', icon: <TagOutlined />, onClick: (record: AdvisorSession) => message.info(`标注质量: ${record.sessionId}`) },
    { key: 'similar', label: '类似', icon: <RobotOutlined />, onClick: (record: AdvisorSession) => message.info(`查找类似问题`) },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold m-0 flex items-center gap-3"><RobotOutlined style={{ color: '#F0B90B' }} /> 企业投顾助手</h1>
            <p className="text-gray-500 text-sm mt-2">AI驱动的投资顾问问答系统 · 智能问答/知识库/策略推荐 · AIOPC投顾大脑</p>
          </div>
          <Space><Button icon={<ReloadOutlined />} onClick={() => message.success('刷新')}>刷新</Button><Button type="primary" icon={<PlusOutlined />}>新建会话</Button></Space>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard title="会话总数" value={totalSessions} icon={<RobotOutlined />} color="#1677FF" description="累计问答" />
          <DataCard title="今日查询" value={todayCount} icon={<ThunderboltOutlined />} color="#16A34A" description="当日新增" />
          <DataCard title="平均置信度" value={`${avgConfidence}%`} icon={<LikeOutlined />} color="#7C3AED" suffix="/100" description="AI信心水平" />
          <DataCard title="正反馈率" value={`${positiveRate}%`} icon={<LikeOutlined />} color="#F59E0B" description="用户满意度" />
          <DataCard title="平均响应时间" value={`${avgLatency}ms`} icon={<ClockCircleOutlined />} color="#F0B90B" description="响应效率" />
        </div>

        <Card size="small">
          <Space wrap>
            <Select placeholder="问题类别" style={{ width: 140 }} allowClear value={filterCategory || undefined} onChange={setFilterCategory}>
              <Option value="portfolio_allocation">资产配置</Option><Option value="market_analysis">市场分析</Option>
              <Option value="stock_picking">选股策略</Option><Option value="risk_management">风险管理</Option><Option value="tax_optimization">税务优化</Option>
            </Select>
            <Select placeholder="反馈" style={{ width: 110 }} allowClear value={filterFeedback || undefined} onChange={setFilterFeedback}>
              <Option value="positive">好评</Option><Option value="neutral">中性</Option><Option value="negative">差评</Option>
            </Select>
            <Select placeholder="时间范围" style={{ width: 130 }} allowClear value={filterTimeRange || undefined} onChange={setFilterTimeRange}>
              <Option value="today">今天</Option><Option value="week">本周</Option><Option value="month">本月</Option>
            </Select>
          </Space>
        </Card>

        <DataTable columns={columns as any} dataSource={filteredSessions as any} rowKey="id" actions={actions} showSearch={false} showAdd={false} />

        <Modal title={<span>会话详情 - <span style={{ color: '#F0B90B' }}>{selectedSession?.sessionId}</span></span>} open={detailModalOpen} onCancel={() => setDetailModalOpen(false)} footer={[<Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>, <Button key="export" icon={<ExportOutlined />}>导出会话</Button>]} width={860}>
          {selectedSession && (
            <div className="space-y-6">
              <Divider orientation="left">完整对话</Divider>
              <Card size="small">
                <Space direction="vertical" className="w-full" size="large">
                  <div className="flex gap-3 p-3 bg-blue-50 rounded-lg"><QuestionCircleOutlined style={{ color: '#1677FF', fontSize: 18, marginTop: 2 }} /><div><div className="font-semibold text-blue-800">用户提问</div><p className="mt-1 text-gray-700">{selectedSession.userQuery}</p></div></div>
                  <div className="flex gap-3 p-3 bg-green-50 rounded-lg"><RobotOutlined style={{ color: '#16A34A', fontSize: 18, marginTop: 2 }} /><div><div className="font-semibold text-green-800">AI顾问回答</div><p className="mt-1 text-gray-700 leading-relaxed">{selectedSession.aiResponse}</p></div></div>
                </Space>
              </Card>

              <Divider orientation="left">信息来源</Divider>
              <Table size="small" pagination={false} dataSource={Array.from({ length: selectedSession.sources }, (_, i) => ({ name: `数据源 ${i + 1}`, type: ['财报', '新闻', '研报', '行情', '法规'][i % 5], credibility: ['高', '官方', '高', '中', '高'][i % 5] }))} columns={[{ title: '来源名称', dataIndex: 'name', key: 'name' }, { title: '类型', dataIndex: 'type', key: 'type' }, { title: '可信度', dataIndex: 'credibility', key: 'credibility', render: (v: string) => <Tag color={v === '官方' ? 'green' : v === '高' ? 'blue' : 'default'}>{v}</Tag> }]} rowKey="name" />

              <Divider orientation="left"><StarIcon style={{ color: '#F0B90B' }} /> AIOPC回答质量评估</Divider>
              <Card size="small" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFDF5 100%)', borderColor: '#F0B90B' }}>
                <div className="mb-3"><span className="text-lg font-bold" style={{ color: '#F0B90B' }}>质量评分: {Math.round(selectedSession.confidence * 0.98)}/100</span></div>
                <Space direction="vertical" className="w-full" size="middle">
                  <div><div className="flex justify-between mb-1"><span className="text-sm">准确性</span><span className="text-sm font-semibold">{selectedSession.confidence}%</span></div><Progress percent={selectedSession.confidence} strokeColor="#1677FF" showInfo={false} size="small" /></div>
                  <div><div className="flex justify-between mb-1"><span className="text-sm">完整性</span><span className="text-sm font-semibold">{Math.min(95, selectedSession.confidence + 5)}%</span></div><Progress percent={Math.min(95, selectedSession.confidence + 5)} strokeColor="#16A34A" showInfo={false} size="small" /></div>
                  <div><div className="flex justify-between mb-1"><span className="text-sm">时效性</span><span className="text-sm font-semibold">{Math.min(92, selectedSession.confidence + 2)}%</span></div><Progress percent={Math.min(92, selectedSession.confidence + 2)} strokeColor="#7C3AED" showInfo={false} size="small" /></div>
                </Space>
              </Card>

              <Divider orientation="left">改进建议</Divider>
              <Card size="small"><ul className="space-y-2 text-sm text-gray-600"><li>• 可增加更多实时行情数据引用</li><li>• 建议补充风险提示和免责声明</li><li>• 追问环节可提供更具体的操作建议</li></ul></Card>

              <Divider orientation="left">相关会话</Divider>
              <Table size="small" pagination={false} dataSource={mockSessions.slice(0, 3).map(s => ({ id: s.sessionId, query: s.userQuery.substring(0, 40), similarity: Math.round(Math.random() * 30 + 65) + '%' }))} columns={[{ title: '会话ID', dataIndex: 'id', key: 'id' }, { title: '相似问题', dataIndex: 'query', key: 'query' }, { title: '相似度', dataIndex: 'similarity', key: 'similarity' }]} rowKey="id" />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
