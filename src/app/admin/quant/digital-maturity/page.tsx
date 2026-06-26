'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
import { Button, Space, Tag, Modal, message, Select, Table, Card, Progress, Tooltip, Divider, Descriptions } from 'antd';
import { SearchOutlined, EyeOutlined, PlusOutlined, ReloadOutlined, ExportOutlined, LineChartOutlined, TrophyOutlined, WarningOutlined, RocketOutlined, AuditOutlined, CompassOutlined, StarFilled as StarIcon, } from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

const { Option } = Select;

interface DxMaturityAssessment {
  id: string;
  companyName: string;
  industry: string;
  assessmentDate: string;
  assessor: string;
  overallScore: number;
  dxLevel: 'initial' | 'developing' | 'defined' | 'managed' | 'optimizing';
  dimensions: { strategy: number; culture: number; technology: number; data: number; operations: number };
  strengths: string[];
  gaps: string[];
  recommendations: string[];
  nextReviewDate: string;
  improvementRoadmap: string[];
}

const mockAssessments: DxMaturityAssessment[] = [
  { id: '1', companyName: '华为技术有限公司', industry: '通信设备/电子', assessmentDate: '2024-06-15', assessor: 'AIOPC-DX-Engine', overallScore: 88, dxLevel: 'optimizing', dimensions: { strategy: 92, culture: 85, technology: 94, data: 90, operations: 86 }, strengths: ['云原生架构成熟', '数据治理体系完善', 'AI研发投入领先'], gaps: ['跨部门协同效率待提升'], recommendations: ['建立统一数据中台', '推广低代码平台'], nextReviewDate: '2024-12-15', improvementRoadmap: ['Q3完成数据中台2.0', 'Q4实现全域数字化运营'] },
  { id: '2', companyName: '腾讯控股有限公司', industry: '互联网/社交', assessmentDate: '2024-06-10', assessor: 'AIOPC-DX-Engine', overallScore: 91, dxLevel: 'optimizing', dimensions: { strategy: 95, culture: 90, technology: 93, data: 92, operations: 88 }, strengths: ['技术栈先进', '产品迭代速度快', '数据驱动决策深入'], gaps: ['组织敏捷性可优化'], recommendations: ['深化OKR管理实践', '推进AI辅助决策系统'], nextReviewDate: '2024-12-10', improvementRoadmap: ['Q3部署企业级AI助手', 'Q4完成智能运营中心'] },
  { id: '3', companyName: '比亚迪股份有限公司', industry: '新能源汽车/电池', assessmentDate: '2024-06-05', assessor: 'AIOPC-DX-Engine', overallScore: 76, dxLevel: 'managed', dimensions: { strategy: 82, culture: 70, technology: 80, data: 75, operations: 78 }, strengths: ['智能制造水平高', '供应链数字化程度好'], gaps: ['数据标准化不足', '文化转型需加速'], recommendations: ['建立主数据管理体系', '推动全员数字素养培训'], nextReviewDate: '2024-12-05', improvementRoadmap: ['Q3实施MDM项目', 'Q4开展DX训练营'] },
  { id: '4', companyName: '中国平安保险(集团)', industry: '金融科技/保险', assessmentDate: '2024-05-28', assessor: 'AIOPC-DX-Engine', overallScore: 84, dxLevel: 'managed', dimensions: { strategy: 88, culture: 82, technology: 86, data: 85, operations: 80 }, strengths: ['金融科技创新能力强', '客户体验数字化领先'], gaps: ['遗留系统集成复杂', '监管合规自动化待提升'], recommendations: ['加速核心系统现代化', '构建RegTech平台'], nextReviewDate: '2024-11-28', improvementRoadmap: ['Q3启动核心银行重构', 'Q4上线智能合规引擎'] },
  { id: '5', companyName: '美的集团股份有限公司', industry: '家电制造/智能家居', assessmentDate: '2024-05-20', assessor: 'AIOPC-DX-Engine', overallScore: 79, dxLevel: 'managed', dimensions: { strategy: 80, culture: 75, technology: 82, data: 76, operations: 81 }, strengths: ['工业互联网平台成熟', '智能制造标杆'], gaps: ['数据资产化程度不够', '生态协同能力弱'], recommendations: ['建设数据资产目录', '开放API生态体系'], nextReviewDate: '2024-11-20', improvementRoadmap: ['Q3发布数据资产地图', 'Q4开放100+API接口'] },
  { id: '6', companyName: '字节跳动科技有限公司', industry: '互联网/内容', assessmentDate: '2024-05-15', assessor: 'AIOPC-DX-Engine', overallScore: 89, dxLevel: 'optimizing', dimensions: { strategy: 90, culture: 88, technology: 95, data: 92, operations: 84 }, strengths: ['算法驱动业务模式', 'A/B测试文化浓厚', '实时数据处理能力极强'], gaps: ['全球化运营复杂度高'], recommendations: ['建设全球统一数据平台', '优化跨国团队协作工具'], nextReviewDate: '2024-11-15', improvementRoadmap: ['Q3整合TikTok数据体系', 'Q4升级协作平台'] },
  { id: '7', companyName: '宁德时代新能源科技', industry: '新能源/电池制造', assessmentDate: '2024-05-08', assessor: 'AIOPC-DX-Engine', overallScore: 72, dxLevel: 'defined', dimensions: { strategy: 75, culture: 68, technology: 78, data: 70, operations: 74 }, strengths: ['产线自动化程度高', '质量追溯系统完善'], gaps: ['战略数字化规划薄弱', '人才结构需优化'], recommendations: ['制定DX三年战略', '引进数字化高端人才'], nextReviewDate: '2024-11-08', improvementRoadmap: ['Q3发布DX战略白皮书', 'Q4组建数字化研究院'] },
  { id: '8', companyName: '京东集团股份有限公司', industry: '电商/物流/零售', assessmentDate: '2024-04-28', assessor: 'AIOPC-DX-Engine', overallScore: 86, dxLevel: 'managed', dimensions: { strategy: 88, culture: 84, technology: 90, data: 88, operations: 82 }, strengths: ['供应链数字化行业第一', '智能仓储系统领先'], gaps: ['前端体验一致性待提升'], recommendations: ['统一设计系统', '优化全渠道体验'], nextReviewDate: '2024-10-28', improvementRoadmap: ['Q3发布设计系统3.0', 'Q4实现全渠道无缝切换'] },
  { id: '9', companyName: '海尔智家股份有限公司', industry: '家电/物联网', assessmentDate: '2024-04-20', assessor: 'AIOPC-DX-Engine', overallScore: 77, dxLevel: 'defined', dimensions: { strategy: 78, culture: 72, technology: 80, data: 74, operations: 79 }, strengths: ['COSMOPlat工业互联网平台', '用户定制化能力强'], gaps: ['数据孤岛问题明显', '创新机制不够灵活'], recommendations: ['打破部门数据壁垒', '建立内部创业孵化器'], nextReviewDate: '2024-10-20', improvementRoadmap: ['Q3实施数据湖项目', 'Q4启动创新工坊'] },
  { id: '10', companyName: '小米集团', industry: '消费电子/IoT', assessmentDate: '2024-06-01', assessor: 'AIOPC-DX-Engine', overallScore: 83, dxLevel: 'managed', dimensions: { strategy: 85, culture: 80, technology: 86, data: 82, operations: 81 }, strengths: ['生态链数字化协同好', '用户体验数据丰富'], gaps: ['国际化DX能力不均', '供应链可视化不足'], recommendations: ['统一全球IT标准', '搭建供应链控制塔'], nextReviewDate: '2024-12-01', improvementRoadmap: ['Q3制定全球DX标准', 'Q4上线供应链控制塔'] },
];

const levelConfig: Record<string, { label: string; color: string; icon: string }> = {
  initial: { label: '初始级', color: '#DC2626', icon: '🌱' },
  developing: { label: '发展级', color: '#F59E0B', icon: '🌿' },
  defined: { label: '已定义级', color: '#3B82F6', icon: '🌳' },
  managed: { label: '已管理级', color: '#8B5CF6', icon: '💎' },
  optimizing: { label: '优化级', color: '#16A34A', icon: '🚀' },
};

const dimNames: Record<string, string> = { strategy: '战略', culture: '文化', technology: '技术', data: '数据', operations: '运作' };

export default function DigitalMaturityPage() {
  const [selectedAssessment, setSelectedAssessment] = useState<DxMaturityAssessment | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterIndustry, setFilterIndustry] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [sortByDim, setSortByDim] = useState<string>('');

  const filteredAssessments = mockAssessments.filter((a) => {
    if (filterIndustry && !a.industry.includes(filterIndustry)) return false;
    if (filterLevel && a.dxLevel !== filterLevel) return false;
    return true;
  }).sort((a, b) => {
    if (sortByDim) return b.dimensions[sortByDim as keyof typeof a.dimensions] - a.dimensions[sortByDim as keyof typeof a.dimensions];
    return b.overallScore - a.overallScore;
  });

  const totalCompanies = mockAssessments.length;
  const avgScore = Math.round(mockAssessments.reduce((sum, a) => sum + a.overallScore, 0) / totalCompanies);
  const optimizingCount = mockAssessments.filter(a => a.dxLevel === 'optimizing').length;
  const weakestDim = Object.entries(mockAssessments.reduce((acc, a) => {
    Object.entries(a.dimensions).forEach(([k, v]) => { acc[k] = (acc[k] || 0) + v; });
    return acc;
  }, {} as Record<string, number>)).sort(([,a], [,b]) => a - b)[0]?.[0];
  const thisMonthNew = mockAssessments.filter(a => dayjs(a.assessmentDate).isAfter(dayjs().subtract(30, 'day'))).length;

  const columns = [
    { title: '企业名称', dataIndex: 'companyName', key: 'companyName', render: (t: string) => <span className="font-semibold text-blue-600">{t}</span> },
    { title: '行业', dataIndex: 'industry', key: 'industry', width: 160, ellipsis: true },
    { title: '总分', dataIndex: 'overallScore', key: 'overallScore', render: (v: number) => <Progress type="circle" percent={v} size={48} format={() => <span style={{ fontWeight: 700 }}>{v}</span>} strokeColor={v >= 85 ? '#52c41a' : v >= 70 ? '#faad14' : '#ff4d4f'} /> },
    { title: 'DX等级', dataIndex: 'dxLevel', key: 'dxLevel', render: (l: string) => <Tag style={{ color: levelConfig[l]?.color, borderColor: levelConfig[l]?.color, fontWeight: 600 }}>{levelConfig[l]?.icon} {levelConfig[l]?.label}</Tag>, sorter: (a: any, b: any) => Object.keys(levelConfig).indexOf(a.dxLevel) - Object.keys(levelConfig).indexOf(b.dxLevel) },
    { title: '战略', dataIndex: ['dimensions', 'strategy'], key: 'strategy', render: (v: number) => <span className={v >= 85 ? 'text-green-600' : v >= 70 ? '' : 'text-red-600'}>{v}</span>, sorter: true },
    { title: '文化', dataIndex: ['dimensions', 'culture'], key: 'culture', render: (v: number) => <span className={v >= 85 ? 'text-green-600' : v >= 70 ? '' : 'text-red-600'}>{v}</span>, sorter: true },
    { title: '技术', dataIndex: ['dimensions', 'technology'], key: 'technology', render: (v: number) => <span className={v >= 85 ? 'text-green-600' : v >= 70 ? '' : 'text-red-600'}>{v}</span>, sorter: true },
    { title: '数据', dataIndex: ['dimensions', 'data'], key: 'data', render: (v: number) => <span className={v >= 85 ? 'text-green-600' : v >= 70 ? '' : 'text-red-600'}>{v}</span>, sorter: true },
    { title: '运作', dataIndex: ['dimensions', 'operations'], key: 'operations', render: (v: number) => <span className={v >= 85 ? 'text-green-600' : v >= 70 ? '' : 'text-red-600'}>{v}</span>, sorter: true },
    { title: '优势数', dataIndex: 'strengths', key: 'strengths', render: (s: string[]) => <Tag color="green">{s.length}</Tag> },
    { title: '缺口数', dataIndex: 'gaps', key: 'gaps', render: (g: string[]) => <Tag color="red">{g.length}</Tag> },
    { title: '评估日期', dataIndex: 'assessmentDate', key: 'assessmentDate', render: (v: string) => dayjs(v).format('YYYY-MM-DD') },
  ];

  const actions: any[] = [
    { key: 'view', label: '详情', icon: <EyeOutlined />, onClick: (record: DxMaturityAssessment) => { setSelectedAssessment(record); setDetailModalOpen(true); } },
    { key: 'export', label: '导出报告', icon: <ExportOutlined />, onClick: (record: DxMaturityAssessment) => message.success(`导出报告: ${record.companyName}`) },
    { key: 'track', label: '跟踪改进', icon: <LineChartOutlined />, onClick: (record: DxMaturityAssessment) => message.info(`跟踪改进: ${record.companyName}`) },
    { key: 'reassess', label: '重新评估', icon: <AuditOutlined />, onClick: (record: DxMaturityAssessment) => message.info(`发起重新评估: ${record.companyName}`) },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-bold m-0 flex items-center gap-3"><CompassOutlined style={{ color: '#F0B90B' }} /> 企业数字化成熟度评估</h1><p className="text-gray-500 text-sm mt-2">数字化转型评分体系 · 战略/文化/技术/数据/运营五维模型 · AIOPC DX诊断</p></div>
          <Space><Button icon={<ReloadOutlined />} onClick={() => message.success('刷新')}>刷新</Button><Button type="primary" icon={<PlusOutlined />}>新建评估</Button></Space>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard title="评估企业数" value={totalCompanies} icon={<TrophyOutlined />} color="#1677FF" description="累计评估" />
          <DataCard title="平均DX分数" value={avgScore} icon={<LineChartOutlined />} color="#16A34A" suffix="/100" description="整体水平" />
          <DataCard title="优化级占比" value={`${Math.round(optimizingCount / totalCompanies * 100)}%`} icon={<RocketOutlined />} color="#F0B90B" description="顶尖企业" />
          <DataCard title="最大短板维度" value={dimNames[weakestDim] || '-'} icon={<WarningOutlined />} color="#DC2626" description="普遍薄弱项" />
          <DataCard title="本月新增" value={thisMonthNew} icon={<PlusOutlined />} color="#7C3AED" description="新评估企业" />
        </div>

        <Card size="small">
          <Space wrap>
            <Select placeholder="行业筛选" style={{ width: 150 }} allowClear value={filterIndustry || undefined} onChange={setFilterIndustry}>
              <Option value="互联网">互联网</Option><Option value="制造">制造业</Option><Option value="金融">金融</Option><Option value="新能源">新能源</Option><Option value="通信">通信</Option><Option value="电商">电商</Option>
            </Select>
            <Select placeholder="DX等级" style={{ width: 130 }} allowClear value={filterLevel || undefined} onChange={setFilterLevel}>
              <Option value="initial">初始级</Option><Option value="developing">发展级</Option><Option value="defined">已定义级</Option><Option value="managed">已管理级</Option><Option value="optimizing">优化级</Option>
            </Select>
            <Select placeholder="按维度排序" style={{ width: 130 }} allowClear value={sortByDim || undefined} onChange={setSortByDim}>
              <Option value="strategy">战略得分</Option><Option value="culture">文化得分</Option><Option value="technology">技术得分</Option><Option value="data">数据得分</Option><Option value="operations">运作得分</Option>
            </Select>
          </Space>
        </Card>

        <DataTable columns={columns as any} dataSource={filteredAssessments as any} rowKey="id" actions={actions} showSearch={false} showAdd={false} />

        <Modal title={<span>评估详情 - <span style={{ color: '#F0B90B' }}>{selectedAssessment?.companyName}</span></span>} open={detailModalOpen} onCancel={() => setDetailModalOpen(false)} footer={[<Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>, <Button key="export" icon={<ExportOutlined />}>导出完整报告</Button>]} width={880}>
          {selectedAssessment && (
            <div className="space-y-6">
              <Divider orientation="left">企业概况</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="企业名称">{selectedAssessment.companyName}</Descriptions.Item>
                <Descriptions.Item label="评估ID"><code>{selectedAssessment.id}</code></Descriptions.Item>
                <Descriptions.Item label="所属行业">{selectedAssessment.industry}</Descriptions.Item>
                <Descriptions.Item label="DX等级"><Tag style={{ color: levelConfig[selectedAssessment.dxLevel]?.color, borderColor: levelConfig[selectedAssessment.dxLevel]?.color, fontWeight: 600 }}>{levelConfig[selectedAssessment.dxLevel]?.icon} {levelConfig[selectedAssessment.dxLevel]?.label}</Tag></Descriptions.Item>
                <Descriptions.Item label="综合评分"><span className="text-2xl font-bold" style={{ color: selectedAssessment.overallScore >= 85 ? '#16A34A' : selectedAssessment.overallScore >= 70 ? '#F59E0B' : '#DC2626' }}>{selectedAssessment.overallScore}/100</span></Descriptions.Item>
                <Descriptions.Item label="评估日期">{dayjs(selectedAssessment.assessmentDate).format('YYYY-MM-DD')}</Descriptions.Item>
                <Descriptions.Item label="评估引擎">{selectedAssessment.assessor}</Descriptions.Item>
                <Descriptions.Item label="下次复评">{dayjs(selectedAssessment.nextReviewDate).format('YYYY-MM-DD')}</Descriptions.Item>
              </Descriptions>

              <Divider orientation="left">五维评分雷达描述</Divider>
              <Card size="small">
                <div className="grid grid-cols-5 gap-3 mb-4">
                  {Object.entries(selectedAssessment.dimensions).map(([key, val]) => (
                    <div key={key} className="text-center p-3 rounded-lg" style={{ background: val >= 85 ? '#F0FDF4' : val >= 70 ? '#FFFBEB' : '#FEF2F2' }}>
                      <div className="text-xs text-gray-500 mb-1">{dimNames[key]}</div>
                      <div className={`text-xl font-bold ${val >= 85 ? 'text-green-600' : val >= 70 ? 'text-orange-600' : 'text-red-600'}`}>{val}</div>
                      <Progress percent={val} size="small" showInfo={false} strokeColor={val >= 85 ? '#52c41a' : val >= 70 ? '#faad14' : '#ff4d4f'} />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 text-center">该企业在<strong className="text-blue-600">{dimNames[Object.entries(selectedAssessment.dimensions).sort((a,b) => b[1]-a[1])[0][0]]}</strong>维度表现最佳({Object.entries(selectedAssessment.dimensions).sort((a,b) => b[1]-a[1])[0][1]}分)，<strong className="text-red-600">{dimNames[Object.entries(selectedAssessment.dimensions).sort((a,b) => a[1]-b[1])[0][0]]}</strong>维度相对薄弱({Object.entries(selectedAssessment.dimensions).sort((a,b) => a[1]-b[1])[0][1]}分)，整体处于{levelConfig[selectedAssessment.dxLevel]?.label}阶段。</p>
              </Card>

              <Divider orientation="left"><StarIcon style={{ color: '#F0B90B' }} /> AIOPC DX诊断</Divider>
              <Card size="small" style={{ background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFDF5 100%)', borderColor: '#F0B90B' }}>
                <div className="mb-3"><span className="text-lg font-bold" style={{ color: '#F0B90B' }}>诊断结果: {selectedAssessment.overallScore >= 85 ? '数字化转型领跑者' : selectedAssessment.overallScore >= 70 ? '稳步前进者' : '需要加速追赶'}</span></div>
                <Space direction="vertical" className="w-full" size="middle">
                  {Object.entries(selectedAssessment.dimensions).map(([key, val]) => (
                    <div key={key}><div className="flex justify-between mb-1"><span className="text-sm">{dimNames[key]}成熟度</span><span className="text-sm font-semibold">{val}/100 - {val >= 85 ? '优秀' : val >= 70 ? '良好' : '需提升'}</span></div><Progress percent={val} strokeColor={['#1677FF', '#EC4899', '#16A34A', '#F59E0B', '#7C3AED'][Object.keys(dimNames).indexOf(key)]} showInfo={false} size="small" /></div>
                  ))}
                </Space>
                <div className="mt-4 p-3 bg-white rounded-lg">
                  <div className="font-semibold mb-2" style={{ color: '#F0B90B' }}>★ AI改进优先级建议</div>
                  <ol className="text-sm space-y-1 ml-4 list-decimal">
                    <li><strong>P0-紧急:</strong> {selectedAssessment.gaps[0] || '无紧急缺口'}</li>
                    <li><strong>P1-重要:</strong> {selectedAssessment.gaps[1] || '持续推进现有计划'}</li>
                    <li><strong>P2-优化:</strong> 巩固{dimNames[Object.entries(selectedAssessment.dimensions).sort((a,b) => b[1]-a[1])[0][0]]}优势，形成最佳实践</li>
                  </ol>
                </div>
                <div className="mt-3 p-3 bg-white rounded-lg">
                  <div className="font-semibold mb-2 text-blue-800">📋 转型路线图</div>
                  <ul className="text-sm space-y-1 ml-4">
                    {selectedAssessment.improvementRoadmap.map((item, idx) => (
                      <li key={idx}>• {item}</li>
                    ))}
                    <li>• 长期目标: 达到{levelConfig.optimizing.icon} {levelConfig.optimizing.label}(90分+)</li>
                  </ul>
                </div>
              </Card>

              <Divider orientation="left">优势与差距</Divider>
              <div className="grid grid-cols-2 gap-4">
                <Card size="small" title="✅ 核心优势" style={{ borderTop: '3px solid #16A34A' }}>
                  <ul className="space-y-2">
                    {selectedAssessment.strengths.map((s, i) => <li key={i} className="flex gap-2 text-sm"><TrophyOutlined style={{ color: '#F0B90B', marginTop: 2 }} /><span>{s}</span></li>)}
                  </ul>
                </Card>
                <Card size="small" title="⚠️ 改进缺口" style={{ borderTop: '3px solid #DC2626' }}>
                  <ul className="space-y-2">
                    {selectedAssessment.gaps.map((g, i) => <li key={i} className="flex gap-2 text-sm"><WarningOutlined style={{ color: '#F59E0B', marginTop: 2 }} /><span>{g}</span></li>)}
                  </ul>
                </Card>
              </div>

              <Divider orientation="left">改进路线时间表</Divider>
              <Table size="small" pagination={false} dataSource={selectedAssessment.improvementRoadmap.map((item, idx) => ({
                phase: `Phase ${idx + 1}`,
                milestone: item,
                targetScore: Math.min(95, selectedAssessment.overallScore + (idx + 1) * 5),
                status: idx === 0 ? '进行中' : idx === 1 ? '计划中' : '规划中',
                owner: ['DX办公室', 'CTO办公室', 'CEO办'][idx % 3],
              }))} columns={[
                { title: '阶段', dataIndex: 'phase', key: 'phase', width: 80 },
                { title: '里程碑', dataIndex: 'milestone', key: 'milestone' },
                { title: '目标分数', dataIndex: 'targetScore', key: 'targetScore', render: (v: number) => `${v}分` },
                { title: '状态', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={v === '进行中' ? 'blue' : v === '计划中' ? 'orange' : 'default'}>{v}</Tag> },
                { title: '负责人', dataIndex: 'owner', key: 'owner' },
              ]} rowKey="phase" />

              <Divider orientation="left">历史评估对比</Divider>
              <Table size="small" pagination={false} dataSource={[
                { date: selectedAssessment.assessmentDate, score: selectedAssessment.overallScore, level: selectedAssessment.dxLevel, change: '-', note: '本次评估' },
                { date: dayjs(selectedAssessment.assessmentDate).subtract(180, 'day').format('YYYY-MM-DD'), score: Math.max(50, selectedAssessment.overallScore - Math.round(Math.random() * 15 + 5)), level: ['developing', 'defined', 'managed'][Math.floor(Math.random() * 3)], change: '+' + (selectedAssessment.overallScore - Math.max(50, selectedAssessment.overallScore - Math.round(Math.random() * 15 + 5))), note: '半年前' },
                { date: dayjs(selectedAssessment.assessmentDate).subtract(365, 'day').format('YYYY-MM-DD'), score: Math.max(40, selectedAssessment.overallScore - Math.round(Math.random() * 25 + 10)), level: ['initial', 'developing', 'defined'][Math.floor(Math.random() * 3)], change: '+↑', note: '一年前' },
              ]} columns={[
                { title: '评估日期', dataIndex: 'date', key: 'date' },
                { title: '总分', dataIndex: 'score', key: 'score', render: (v: number) => <span className="font-semibold">{v}</span> },
                { title: '等级', dataIndex: 'level', key: 'level', render: (l: string) => <Tag color={levelConfig[l]?.color}>{levelConfig[l]?.icon} {levelConfig[l]?.label}</Tag> },
                { title: '变化', dataIndex: 'change', key: 'change', render: (v: string) => <span style={{ color: v.includes('+') ? '#16A34A' : '#DC2626' }}>{v}</span> },
                { title: '备注', dataIndex: 'note', key: 'note' },
              ]} rowKey="date" />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
