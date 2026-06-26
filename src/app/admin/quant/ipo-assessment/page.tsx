'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import {
  Button, Space, Tag, Modal, message, Descriptions, Select, Steps, Table, Card, Tooltip, Progress, Row, Col, Divider,
} from 'antd';
import {
  ExperimentFilled, SearchOutlined, EyeOutlined, FileTextOutlined, CalendarOutlined,
  TeamOutlined, TrophyOutlined, RiseOutlined, WarningOutlined, CheckCircleOutlined,
  ClockCircleOutlined, StarOutlined, ThunderboltOutlined, FundOutlined, SafetyCertificateOutlined,
  GlobalOutlined, LineChartOutlined, DownloadOutlined, ExportOutlined, DashboardOutlined,
  AimOutlined, BulbOutlined, AlertOutlined, PercentageOutlined, DollarOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

interface IpoCandidate {
  id: number;
  companyName: string;
  industry: string;
  stage: string;
  country: string;
  estimatedValuation: number;
  revenueLastYear: number;
  revenueGrowth: number;
  grossMargin: number;
  netProfitMargin: number;
  teamScore: number;
  marketSize: number;
  competitivePosition: string;
  techMoat: string;
  esgScore: number;
  overallScore: number;
  aiopcScore: number;
  recommendation: string;
  riskFactors: string[];
  assessedAt: string;
  nextReview: string;
}

const mockCandidates: IpoCandidate[] = [
  { id: 1, companyName: '星云智能科技', industry: '人工智能', stage: 'series-c', country: '中国', estimatedValuation: 2800, revenueLastYear: 520, revenueGrowth: 89, grossMargin: 72, netProfitMargin: 18, teamScore: 92, marketSize: 50000, competitivePosition: 'leader', techMoat: 'strong', esgScore: 85, overallScore: 88, aiopcScore: 91.2, recommendation: 'strong_buy', riskFactors: ['政策监管风险', '人才竞争激烈'], assessedAt: '2025-06-15', nextReview: '2025-09-15' },
  { id: 2, companyName: '绿源新能源', industry: '新能源', stage: 'pre-ipo', country: '中国', estimatedValuation: 8500, revenueLastYear: 2100, revenueGrowth: 65, grossMargin: 35, netProfitMargin: 12, teamScore: 88, marketSize: 200000, competitivePosition: 'leader', techMoat: 'strong', esgScore: 92, overallScore: 90, aiopcScore: 93.5, recommendation: 'strong_buy', riskFactors: ['原材料价格波动'], assessedAt: '2025-06-12', nextReview: '2025-09-12' },
  { id: 3, companyName: '量子计算实验室', industry: '量子科技', stage: 'series-b', country: '美国', estimatedValuation: 1500, revenueLastYear: 45, revenueGrowth: 120, grossMargin: 82, netProfitMargin: -15, teamScore: 95, marketSize: 80000, competitivePosition: 'challenger', techMoat: 'strong', esgScore: 78, overallScore: 78, aiopcScore: 80.5, recommendation: 'buy', riskFactors: ['商业化路径不确定', '技术迭代风险'], assessedAt: '2025-06-10', nextReview: '2025-09-10' },
  { id: 4, companyName: '医联健康平台', industry: '医疗健康', stage: 'series-d', country: '中国', estimatedValuation: 6200, revenueLastYear: 1800, revenueGrowth: 42, grossMargin: 55, netProfitMargin: 8, teamScore: 85, marketSize: 150000, competitivePosition: 'challenger', techMoat: 'moderate', esgScore: 88, overallScore: 82, aiopcScore: 84.3, recommendation: 'buy', riskFactors: ['数据合规风险', '市场竞争加剧'], assessedAt: '2025-06-08', nextReview: '2025-09-08' },
  { id: 5, companyName: '深空航天科技', industry: '航空航天', stage: 'series-c', country: '中国', estimatedValuation: 4200, revenueLastYear: 680, revenueGrowth: 55, grossMargin: 48, netProfitMargin: 6, teamScore: 90, marketSize: 300000, competitivePosition: 'niche', techMoat: 'strong', esgScore: 75, overallScore: 79, aiopcScore: 81.7, recommendation: 'buy', riskFactors: ['研发周期长', '资金需求大'], assessedAt: '2025-06-05', nextReview: '2025-09-05' },
  { id: 6, companyName: '链上金融科技', industry: '区块链', stage: 'series-a', country: '新加坡', estimatedValuation: 380, revenueLastYear: 28, revenueGrowth: 210, grossMargin: 88, netProfitMargin: 22, teamScore: 82, marketSize: 25000, competitivePosition: 'challenger', techMoat: 'moderate', esgScore: 70, overallScore: 72, aiopcScore: 74.8, recommendation: 'hold', riskFactors: ['监管不确定性', '市场波动大'], assessedAt: '2025-06-03', nextReview: '2025-09-03' },
  { id: 7, companyName: '智造机器人', industry: '智能制造', stage: 'pre-ipo', country: '中国', estimatedValuation: 5500, revenueLastYear: 1400, revenueGrowth: 38, grossMargin: 42, netProfitMargin: 10, teamScore: 86, marketSize: 180000, competitivePosition: 'challenger', techMoat: 'moderate', esgScore: 83, overallScore: 81, aiopcScore: 83.2, recommendation: 'buy', riskFactors: ['供应链依赖', '国际竞争'], assessedAt: '2025-06-01', nextReview: '2025-09-01' },
  { id: 8, companyName: '生物基因编辑', industry: '生物科技', stage: 'seed', country: '美国', estimatedValuation: 95, revenueLastYear: 3, revenueGrowth: 350, grossMargin: 92, netProfitMargin: -180, teamScore: 94, marketSize: 60000, competitivePosition: 'niche', techMoat: 'strong', esgScore: 68, overallScore: 65, aiopcScore: 68.9, recommendation: 'avoid', riskFactors: ['伦理争议', '法规限制', '临床周期长'], assessedAt: '2025-05-28', nextReview: '2025-08-28' },
  { id: 9, companyName: '元宇宙娱乐', industry: '元宇宙', stage: 'series-b', country: '韩国', estimatedValuation: 890, revenueLastYear: 120, revenueGrowth: 78, grossMargin: 65, netProfitMargin: -5, teamScore: 78, marketSize: 90000, competitivePosition: 'niche', techMoat: 'weak', esgScore: 72, overallScore: 68, aiopcScore: 70.4, recommendation: 'hold', riskFactors: ['用户增长放缓', '硬件依赖'], assessedAt: '2025-05-25', nextReview: '2025-08-25' },
  { id: 10, companyName: '碳捕集环保', industry: '环保科技', stage: 'series-a', country: '德国', estimatedValuation: 420, revenueLastYear: 56, revenueGrowth: 95, grossMargin: 45, netProfitMargin: 2, teamScore: 84, marketSize: 120000, competitivePosition: 'leader', techMoat: 'strong', esgScore: 96, overallScore: 84, aiopcScore: 86.1, recommendation: 'buy', riskFactors: ['补贴政策变化', '技术成本高'], assessedAt: '2025-05-22', nextReview: '2025-08-22' },
  { id: 11, companyName: '自动驾驶出行', industry: '自动驾驶', stage: 'series-d', country: '美国', estimatedValuation: 12000, revenueLastYear: 3200, revenueGrowth: 48, grossMargin: 38, netProfitMargin: -8, teamScore: 91, marketSize: 500000, competitivePosition: 'challenger', techMoat: 'strong', esgScore: 80, overallScore: 86, aiopcScore: 87.8, recommendation: 'strong_buy', riskFactors: ['安全事故风险', '法规滞后'], assessedAt: '2025-05-20', nextReview: '2025-08-20' },
  { id: 12, companyName: '数字农业平台', industry: '农业科技', stage: 'series-b', country: '以色列', estimatedValuation: 680, revenueLastYear: 95, revenueGrowth: 62, grossMargin: 52, netProfitMargin: 14, teamScore: 80, marketSize: 70000, competitivePosition: 'niche', techMoat: 'moderate', esgScore: 90, overallScore: 77, aiopcScore: 79.3, recommendation: 'hold', riskFactors: ['地域限制', '农户接受度'], assessedAt: '2025-05-18', nextReview: '2025-08-18' },
];

const industries = ['人工智能', '新能源', '量子科技', '医疗健康', '航空航天', '区块链', '智能制造', '生物科技', '元宇宙', '环保科技', '自动驾驶', '农业科技'];
const stages = ['seed', 'series-a', 'series-b', 'series-c', 'series-d', 'pre-ipo'];
const recommendations = ['strong_buy', 'buy', 'hold', 'avoid'];

const stageConfig: Record<string, { color: string; label: string }> = {
  seed: { color: 'default', label: '种子轮' },
  'series-a': { color: 'blue', label: 'A轮' },
  'series-b': { color: 'cyan', label: 'B轮' },
  'series-c': { color: 'purple', label: 'C轮' },
  'series-d': { color: 'orange', label: 'D轮' },
  'pre-ipo': { color: 'green', label: 'Pre-IPO' },
};

const positionConfig: Record<string, { color: string; label: string }> = {
  leader: { color: 'gold', label: '行业领导者' },
  challenger: { color: 'blue', label: '挑战者' },
  niche: { color: 'geekblue', label: '细分龙头' },
};

const moatConfig: Record<string, { color: string; label: string }> = {
  strong: { color: 'green', label: '强护城河' },
  moderate: { color: 'orange', label: '中等护城河' },
  weak: { color: 'red', label: '弱护城河' },
};

const recConfig: Record<string, { color: string; label: string }> = {
  strong_buy: { color: 'success', label: '强烈推荐' },
  buy: { color: 'processing', label: '推荐' },
  hold: { color: 'warning', label: '持有' },
  avoid: { color: 'error', label: '回避' },
};

export default function IpoAssessmentPage() {
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<IpoCandidate | null>(null);
  const [filterIndustry, setFilterIndustry] = useState<string | undefined>();
  const [filterStage, setFilterStage] = useState<string | undefined>();
  const [filterRec, setFilterRec] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');

  const filteredData = mockCandidates.filter((item) => {
    if (filterIndustry && item.industry !== filterIndustry) return false;
    if (filterStage && item.stage !== filterStage) return false;
    if (filterRec && item.recommendation !== filterRec) return false;
    if (searchText && !item.companyName.toLowerCase().includes(searchText.toLowerCase())) return false;
    return true;
  });

  const totalCandidates = filteredData.length;
  const strongBuyCount = filteredData.filter((i) => i.recommendation === 'strong_buy').length;
  const avgAiopcScore = (filteredData.reduce((sum, i) => sum + i.aiopcScore, 0) / (totalCandidates || 1)).toFixed(1);
  const highGrowthCount = filteredData.filter((i) => i.revenueGrowth > 50).length;
  const thisMonthCount = filteredData.filter((i) => dayjs(i.assessedAt).month() === dayjs().month()).length;

  const handleViewDetail = (record: IpoCandidate) => {
    setSelectedRecord(record);
    setDetailModalOpen(true);
  };

  const handleExportReport = (record: IpoCandidate) => {
    message.success(`正在导出 ${record.companyName} 的IPO评估报告...`);
  };

  const handleArrangeRoadshow = (record: IpoCandidate) => {
    message.info(`正在为 ${record.companyName} 安排路演...`);
  };

  const columns = [
    { title: '企业名', dataIndex: 'companyName', key: 'companyName', width: 130, fixed: 'left' as const, render: (t: string) => <a onClick={() => {}} style={{ fontWeight: 600 }}>{t}</a> },
    { title: '行业', dataIndex: 'industry', key: 'industry', width: 100, render: (t: string) => <Tag color="blue">{t}</Tag> },
    { title: '国家', dataIndex: 'country', key: 'country', width: 70 },
    { title: '阶段', dataIndex: 'stage', key: 'stage', width: 90, render: (s: string) => <Tag color={stageConfig[s]?.color}>{stageConfig[s]?.label}</Tag> },
    { title: '估值($M)', dataIndex: 'estimatedValuation', key: 'estimatedValuation', width: 100, render: (v: number) => `$${(v / 1000).toFixed(1)}B` },
    { title: '营收($M)', dataIndex: 'revenueLastYear', key: 'revenueLastYear', width: 90, render: (v: number) => `$${v}M` },
    { title: '增长率%', dataIndex: 'revenueGrowth', key: 'revenueGrowth', width: 85, render: (v: number) => <span style={{ color: v > 50 ? '#16A34A' : '#1677FF', fontWeight: 600 }}>{v}%</span> },
    { title: '毛利率%', dataIndex: 'grossMargin', key: 'grossMargin', width: 80 },
    { title: '团队评分', dataIndex: 'teamScore', key: 'teamScore', width: 90, render: (v: number) => <Progress percent={v} size="small" status={v >= 85 ? 'success' : v >= 70 ? 'normal' : 'exception'} /> },
    { title: '竞争位置', dataIndex: 'competitivePosition', key: 'competitivePosition', width: 105, render: (p: string) => <Tag color={positionConfig[p]?.color}>{positionConfig[p]?.label}</Tag> },
    { title: '技术护城河', dataIndex: 'techMoat', key: 'techMoat', width: 105, render: (m: string) => <Tag color={moatConfig[m]?.color}>{moatConfig[m]?.label}</Tag> },
    { title: 'ESG', dataIndex: 'esgScore', key: 'esgScore', width: 60, render: (v: number) => <span style={{ fontWeight: 600 }}>{v}</span> },
    { title: '总分', dataIndex: 'overallScore', key: 'overallScore', width: 80, render: (v: number) => (
      <Tooltip title={`综合评分: ${v}/100`}>
        <Progress type="circle" percent={v} size={40} format={(p) => p} strokeColor={v >= 80 ? '#16A34A' : v >= 70 ? '#1677FF' : '#F59E0B'} />
      </Tooltip>
    )},
    { title: 'AIOPC', dataIndex: 'aiopcScore', key: 'aiopcScore', width: 80, render: (v: number) => <span style={{ color: '#F0B90B', fontWeight: 700, fontSize: 14 }}>{v}</span> },
    { title: '推荐', dataIndex: 'recommendation', key: 'recommendation', width: 95, render: (r: string) => <Tag color={recConfig[r]?.color}>{recConfig[r]?.label}</Tag> },
    { title: '风险因素', dataIndex: 'riskFactors', key: 'riskFactors', width: 160, render: (factors: string[]) => (
      <Space size={[0, 4]} wrap>{factors.slice(0, 2).map((f, i) => <Tag key={i} color="warning" style={{ fontSize: 11 }}>{f}</Tag>)}
        {factors.length > 2 && <Tag color="default" style={{ fontSize: 11 }}>+{factors.length - 2}</Tag>}
      </Space>
    )},
    { title: '更新时间', dataIndex: 'assessedAt', key: 'assessedAt', width: 105, render: (d: string) => dayjs(d).format('MM-DD HH:mm') },
  ];

  const actions = [
    { key: 'view', label: '查看详情', icon: <EyeOutlined />, type: 'link' as const, onClick: handleViewDetail },
    { key: 'export', label: '导出报告', icon: <DownloadOutlined />, type: 'link' as const, onClick: handleExportReport },
    { key: 'roadshow', label: '安排路演', icon: <CalendarOutlined />, type: 'link' as const, hidden: () => false, onClick: handleArrangeRoadshow },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center gap-3">
          <ExperimentFilled style={{ fontSize: 32, color: '#F0B90B' }} />
          <div>
            <h1 className="text-2xl font-bold m-0" style={{ color: '#111827' }}>IPO综合评估中心</h1>
            <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
              AI驱动的IPO候选企业全维度评估 · 财务/行业/团队/估值/合规五维模型 · Powered by AIOPC Super-Engine
            </p>
          </div>
        </div>

        {/* DataCard 统计卡片 */}
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="候选企业总数" value={totalCandidates} icon={<TeamOutlined />} color="#1677FF" suffix="家" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="强烈推荐" value={strongBuyCount} icon={<TrophyOutlined />} color="#16A34A" suffix="家" trend="up" trendValue="+2 本周" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="平均AIOPC分" value={avgAiopcScore} icon={<ThunderboltOutlined />} color="#F0B90B" suffix="分" description="AIOPC超级引擎评分" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="高增长企业(>50%)" value={highGrowthCount} icon={<RiseOutlined />} color="#7C3AED" suffix="家" />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <DataCard title="本月新评估" value={thisMonthCount} icon={<ClockCircleOutlined />} color="#F59E0B" suffix="次" />
          </Col>
        </Row>

        {/* 筛选区域 */}
        <Card size="small" style={{ borderRadius: 12 }}>
          <Space wrap size="middle">
            <Select placeholder="筛选行业" allowClear style={{ width: 160 }} value={filterIndustry} onChange={setFilterIndustry}>
              {industries.map((ind) => <Select.Option key={ind} value={ind}>{ind}</Select.Option>)}
            </Select>
            <Select placeholder="融资阶段" allowClear style={{ width: 140 }} value={filterStage} onChange={setFilterStage}>
              {stages.map((s) => <Select.Option key={s} value={s}>{stageConfig[s]?.label}</Select.Option>)}
            </Select>
            <Select placeholder="推荐评级" allowClear style={{ width: 140 }} value={filterRec} onChange={setFilterRec}>
              {recommendations.map((r) => <Select.Option key={r} value={r}>{recConfig[r]?.label}</Select.Option>)}
            </Select>
            <input
              placeholder="搜索企业名称..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{
                padding: '5px 11px', border: '1px solid #D9D9D9', borderRadius: 6, width: 200,
                outline: 'none', fontSize: 14,
              }}
            />
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable
          columns={columns as any}
          dataSource={filteredData as any}
          rowKey="id"
          actions={actions as any[]}
          showSearch={false}
          showAdd={false}
          onRefresh={() => message.info('数据已刷新')}
        />

        {/* 详情 Modal */}
        <Modal
          title={`${selectedRecord?.companyName || ''} - IPO综合评估详情`}
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={null}
          width={860}
          destroyOnHidden
        >
          {selectedRecord && (
            <div className="space-y-5">
              {/* 企业概览 */}
              <Card size="small" title={<><FundOutlined /> 企业概览</>} style={{ borderRadius: 8 }}>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="企业名称">{selectedRecord.companyName}</Descriptions.Item>
                  <Descriptions.Item label="所属行业"><Tag color="blue">{selectedRecord.industry}</Tag></Descriptions.Item>
                  <Descriptions.Item label="所在国家">{selectedRecord.country}</Descriptions.Item>
                  <Descriptions.Item label="融资阶段"><Tag color={stageConfig[selectedRecord.stage]?.color}>{stageConfig[selectedRecord.stage]?.label}</Tag></Descriptions.Item>
                  <Descriptions.Item label="预估估值">${(selectedRecord.estimatedValuation / 1000).toFixed(1)}B</Descriptions.Item>
                  <Descriptions.Item label="市场规模">${(selectedRecord.marketSize / 1000).toFixed(0)}B</Descriptions.Item>
                  <Descriptions.Item label="竞争位置"><Tag color={positionConfig[selectedRecord.competitivePosition]?.color}>{positionConfig[selectedRecord.competitivePosition]?.label}</Tag></Descriptions.Item>
                  <Descriptions.Item label="技术护城河"><Tag color={moatConfig[selectedRecord.techMoat]?.color}>{moatConfig[selectedRecord.techMoat]?.label}</Tag></Descriptions.Item>
                </Descriptions>
              </Card>

              {/* 财务指标 */}
              <Card size="small" title={<><LineChartOutlined /> 财务指标</>} style={{ borderRadius: 8 }}>
                <Descriptions column={2} size="small" bordered>
                  <Descriptions.Item label="上年营收">${selectedRecord.revenueLastYear}M</Descriptions.Item>
                  <Descriptions.Item label="营收增长率"><span style={{ color: selectedRecord.revenueGrowth > 50 ? '#16A34A' : '#1677FF', fontWeight: 600 }}>{selectedRecord.revenueGrowth}%</span></Descriptions.Item>
                  <Descriptions.Item label="毛利率">{selectedRecord.grossMargin}%</Descriptions.Item>
                  <Descriptions.Item label="净利率">{selectedRecord.netProfitMargin}%</Descriptions.Item>
                  <Descriptions.Item label="团队评分">{selectedRecord.teamScore}/100</Descriptions.Item>
                  <Descriptions.Item label="ESG评分">{selectedRecord.esgScore}/100</Descriptions.Item>
                  <Descriptions.Item label="综合总分"><span style={{ fontWeight: 700, fontSize: 16, color: selectedRecord.overallScore >= 80 ? '#16A34A' : '#F59E0B' }}>{selectedRecord.overallScore}/100</span></Descriptions.Item>
                  <Descriptions.Item label="AIOPC评分"><span style={{ fontWeight: 700, fontSize: 16, color: '#F0B90B' }}>{selectedRecord.aiopcScore}</span></Descriptions.Item>
                </Descriptions>
              </Card>

              {/* ★AIOPC五维评估 */}
              <Card size="small" title={<span style={{ color: '#F0B90B' }}><ThunderboltOutlined /> ★ AIOPC五维评估</span>} style={{ borderRadius: 8, borderColor: '#F0B90B' }}>
                <div className="space-y-4">
                  <div><span className="font-semibold">营收增长能力</span><Progress percent={Math.min(selectedRecord.revenueGrowth, 100)} strokeColor="#1677FF" showInfo /></div>
                  <div><span className="font-semibold">盈利能力</span><Progress percent={Math.min(Math.abs(selectedRecord.netProfitMargin) * 5 + 30, 100)} strokeColor="#16A34A" showInfo /></div>
                  <div><span className="font-semibold">市场规模潜力</span><Progress percent={Math.min(selectedRecord.marketSize / 5000, 100)} strokeColor="#7C3AED" showInfo /></div>
                  <div><span className="font-semibold">团队实力</span><Progress percent={selectedRecord.teamScore} strokeColor="#F59E0B" showInfo /></div>
                  <div><span className="font-semibold">ESG合规</span><Progress percent={selectedRecord.esgScore} strokeColor="#16A34A" showInfo /></div>
                  <Divider />
                  <div style={{ background: '#FFFBE6', padding: 12, borderRadius: 8, borderLeft: '4px solid #F0B90B' }}>
                    <BulbOutlined style={{ color: '#F0B90B', marginRight: 8 }} />
                    <span className="font-semibold" style={{ color: '#F0B90B' }}>AI推荐语：</span>
                    {selectedRecord.recommendation === 'strong_buy' && `${selectedRecord.companyName}在${selectedRecord.industry}领域展现出卓越的竞争力和成长性，AIOPC强烈推荐优先推进IPO进程。`}
                    {selectedRecord.recommendation === 'buy' && `${selectedRecord.companyName}基本面良好，建议纳入重点观察池，择机推进。`}
                    {selectedRecord.recommendation === 'hold' && `${selectedRecord.companyName}存在一定不确定性，建议持续跟踪关键指标变化。`}
                    {selectedRecord.recommendation === 'avoid' && `${selectedRecord.companyName}当前阶段不建议推进，需解决核心风险后再评估。`}
                  </div>
                  {selectedRecord.riskFactors.length > 0 && (
                    <div style={{ background: '#FFF2F0', padding: 12, borderRadius: 8, borderLeft: '4px solid #DC2626' }}>
                      <AlertOutlined style={{ color: '#DC2626', marginRight: 8 }} />
                      <span className="font-semibold" style={{ color: '#DC2626' }}>⚠ 风险提示：</span>
                      {selectedRecord.riskFactors.join('、')}
                    </div>
                  )}
                </div>
              </Card>

              {/* 评估流程 Steps */}
              <Card size="small" title={<><SafetyCertificateOutlined /> 评估流程进度</>} style={{ borderRadius: 8 }}>
                <Steps
                  current={selectedRecord.stage === 'seed' ? 0 : selectedRecord.stage === 'series-a' ? 1 : selectedRecord.stage === 'series-b' ? 2 : selectedRecord.stage === 'series-c' ? 3 : selectedRecord.stage === 'series-d' ? 4 : 5}
                  items={[
                    { title: '初步筛选', description: '基础信息审核' },
                    { title: '财务分析', description: '财务数据深度审计' },
                    { title: '行业对标', description: '同业对比分析' },
                    { title: '团队尽调', description: '管理层访谈评估' },
                    { title: '风险评估', description: '合规与风险扫描' },
                    { title: '最终评审', description: 'AIOPC综合打分' },
                  ]}
                />
              </Card>

              {/* 竞争对手对比表 */}
              <Card size="small" title={<><AimOutlined /> 同业竞争对手对比</>} style={{ borderRadius: 8 }}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={[
                    { name: selectedRecord.companyName, valuation: selectedRecord.estimatedValuation, growth: selectedRecord.revenueGrowth, margin: selectedRecord.grossMargin, score: selectedRecord.aiopcScore, highlight: true },
                    { name: `${selectedRecord.industry}标杆A`, valuation: Math.round(selectedRecord.estimatedValuation * 1.3), growth: Math.round(selectedRecord.revenueGrowth * 0.8), margin: Math.round(selectedRecord.grossMargin * 1.1), score: (selectedRecord.aiopcScore + 3).toFixed(1), highlight: false },
                    { name: `${selectedRecord.industry}竞品B`, valuation: Math.round(selectedRecord.estimatedValuation * 0.7), growth: Math.round(selectedRecord.revenueGrowth * 1.2), margin: Math.round(selectedRecord.grossMargin * 0.9), score: (selectedRecord.aiopcScore - 5).toFixed(1), highlight: false },
                  ]}
                  columns={[
                    { title: '公司名称', dataIndex: 'name', key: 'name', render: (t: string, r: any) => r.highlight ? <span style={{ fontWeight: 700, color: '#1677FF' }}>{t}★</span> : t },
                    { title: '估值($M)', dataIndex: 'valuation', key: 'valuation', render: (v: number) => `$${v}M` },
                    { title: '增长率%', dataIndex: 'growth', key: 'growth' },
                    { title: '毛利率%', dataIndex: 'margin', key: 'margin' },
                    { title: 'AIOPC分', dataIndex: 'score', key: 'score', render: (s: string) => <span style={{ color: '#F0B90B', fontWeight: 600 }}>{s}</span> },
                  ]}
                  rowKey="name"
                />
              </Card>

              {/* 操作日志 */}
              <Card size="small" title={<><ClockCircleOutlined /> 评估操作日志</>} style={{ borderRadius: 8 }}>
                <Table
                  size="small"
                  pagination={false}
                  dataSource={[
                    { action: '创建评估档案', operator: '系统自动', time: dayjs(selectedRecord.assessedAt).subtract(7, 'day').format('YYYY-MM-DD HH:mm'), result: '成功' },
                    { action: '财务数据采集', operator: 'AI数据引擎', time: dayjs(selectedRecord.assessedAt).subtract(5, 'day').format('YYYY-MM-DD HH:mm'), result: '完成' },
                    { action: '五维模型评估', operator: 'AIOPC引擎', time: dayjs(selectedRecord.assessedAt).subtract(2, 'day').format('YYYY-MM-DD HH:mm'), result: `得分 ${selectedRecord.aiopcScore}` },
                    { action: '人工复核确认', operator: '分析师张三', time: selectedRecord.assessedAt + ' 14:30', result: recConfig[selectedRecord.recommendation]?.label },
                  ]}
                  columns={[
                    { title: '操作内容', dataIndex: 'action', key: 'action' },
                    { title: '操作人', dataIndex: 'operator', key: 'operator' },
                    { title: '时间', dataIndex: 'time', key: 'time' },
                    { title: '结果', dataIndex: 'result', key: 'result', render: (t: string) => <Tag color="success">{t}</Tag> },
                  ]}
                  rowKey="action"
                />
              </Card>
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
