'use client';

import { useState } from 'react';
import dayjs from 'dayjs';
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
  EditOutlined,
  FileTextOutlined,
  DownloadOutlined,
  InboxOutlined,
  ReadOutlined,
  StarOutlined,
  ThunderboltOutlined,
  FileProtectOutlined,
  AlertOutlined,
} from '@ant-design/icons';
import AdminLayout from '@/components/admin/AdminLayout';
import { DataTable } from '@/components/admin/DataTable';
import { DataCard } from '@/components/admin/DataCard';

const { Option } = Select;

interface ResearchReport {
  id: string;
  reportTitle: string;
  targetCompany: string;
  industry: string;
  reportType: 'deep_dive' | 'earnings' | 'competitive' | 'sector';
  author: 'ai_analyst' | 'human' | 'ai+human';
  status: 'draft' | 'in_review' | 'published' | 'archived';
  pages: number;
  executiveSummary: string;
  keyFindings: string[];
  rating: 'buy' | 'hold' | 'sell';
  priceTarget: number;
  riskDisclosure: string;
  publishedAt: string;
  readCount: number;
  downloadCount: number;
}

const mockReports: ResearchReport[] = [
  {
    id: 'RPT-001',
    reportTitle: 'NVIDIA深度研报：AI算力霸主的投资逻辑与风险',
    targetCompany: 'NVIDIA Corp',
    industry: '半导体/人工智能',
    reportType: 'deep_dive',
    author: 'ai+human',
    status: 'published',
    pages: 45,
    executiveSummary: '本报告深入分析NVIDIA在AI芯片领域的技术护城河、数据中心业务增长前景及估值合理性...',
    keyFindings: ['数据中心收入占比突破80%', 'H100需求持续超预期', '毛利率维持在70%+高位', '中国区营收面临不确定性'],
    rating: 'buy',
    priceTarget: 1200,
    riskDisclosure: '地缘政治风险、竞争加剧、估值过高',
    publishedAt: '2024-06-20',
    readCount: 3580,
    downloadCount: 1250,
  },
  {
    id: 'RPT-002',
    reportTitle: 'Q2财报解读：苹果服务业务持续高增长',
    targetCompany: 'Apple Inc',
    industry: '消费电子',
    reportType: 'earnings',
    author: 'ai_analyst',
    status: 'published',
    pages: 28,
    executiveSummary: '苹果Q2财报显示iPhone销量略低于预期，但服务业务同比增长15%创历史新高...',
    keyFindings: ['服务收入占比达25%', 'App Store利润率维持85%', 'Vision Pro初期反响良好', '中国市场承压'],
    rating: 'hold',
    priceTarget: 195,
    riskDisclosure: '硬件创新放缓、监管压力、汇率波动',
    publishedAt: '2024-06-18',
    readCount: 2890,
    downloadCount: 980,
  },
  {
    id: 'RPT-003',
    reportTitle: '云计算三巨头竞争力对比分析',
    targetCompany: 'AWS/Azure/GCP',
    industry: '云计算/SaaS',
    reportType: 'competitive',
    author: 'human',
    status: 'in_review',
    pages: 62,
    executiveSummary: '全面对比AWS、Azure、GCP三大云厂商的市场份额、技术能力、定价策略及未来展望...',
    keyFindings: ['AWS市场份额32%仍领先', 'Azure在企业市场增速最快', 'GCP AI能力差异化明显', '多云战略成为主流'],
    rating: 'buy',
    priceTarget: 0,
    riskDisclosure: '行业报告不涉及具体投资建议',
    publishedAt: '',
    readCount: 0,
    downloadCount: 0,
  },
  {
    id: 'RPT-004',
    reportTitle: '新能源汽车行业全景分析：格局重塑中的投资机会',
    targetCompany: 'EV Sector',
    industry: '新能源汽车',
    reportType: 'sector',
    author: 'ai+human',
    status: 'published',
    pages: 55,
    executiveSummary: '全球新能源车市场进入淘汰赛阶段，中国品牌加速出海，智能化成为新竞争焦点...',
    keyFindings: ['全球渗透率突破18%', '比亚迪市占率31%', '特斯拉FSD进展超预期', '固态电池商业化临近'],
    rating: 'buy',
    priceTarget: 0,
    riskDisclosure: '政策变化、原材料价格波动、技术路线不确定',
    publishedAt: '2024-06-15',
    readCount: 4200,
    downloadCount: 1680,
  },
  {
    id: 'RPT-005',
    reportTitle: '台积电先进制程跟踪报告：3nm量产进度与客户结构',
    targetCompany: 'TSMC',
    industry: '半导体制造',
    reportType: 'deep_dive',
    author: 'ai_analyst',
    status: 'draft',
    pages: 38,
    executiveSummary: '台积电3nm制程良率提升至82%，主要客户包括苹果、高通、联发科等...',
    keyFindings: ['3nm月产能达10万片', 'CoWoS封装供不应求', '2nm预计2025年量产', '美国厂建设按计划推进'],
    rating: 'buy',
    priceTarget: 1050,
    riskDisclosure: '地缘风险、大客户集中度过高',
    publishedAt: '',
    readCount: 0,
    downloadCount: 0,
  },
  {
    id: 'RPT-006',
    reportTitle: 'Meta Platforms Q1财报解读：广告复苏与AI投入平衡',
    targetCompany: 'Meta Platforms',
    industry: '社交媒体/元宇宙',
    reportType: 'earnings',
    author: 'ai_analyst',
    status: 'published',
    pages: 25,
    executiveSummary: 'Meta Q1广告收入恢复强劲增长，Reality Labs亏损收窄但仍需关注AI资本支出影响...',
    keyFindings: ['广告收入同比+22%', 'Reels商业化提速', 'Llama 3开源影响力扩大', 'Reality Labs亏损$38亿'],
    rating: 'hold',
    priceTarget: 520,
    riskDisclosure: '隐私法规、AI投入回报不确定、VR/AR普及慢于预期',
    publishedAt: '2024-05-30',
    readCount: 2150,
    downloadCount: 760,
  },
  {
    id: 'RPT-007',
    reportTitle: '生物医药行业：GLP-1药物革命带来的产业链机会',
    targetCompany: 'Pharma Sector',
    industry: '生物医药',
    reportType: 'sector',
    author: 'ai+human',
    status: 'published',
    pages: 48,
    executiveSummary: 'GLP-1类药物市场规模爆发式增长，从原研药到仿制药、CDMO全产业链受益...',
    keyFindings: ['全球市场规模预计2030年达$1500亿', '诺和诺德礼来双寡头格局', '中国CDMO企业订单饱满', '口服制剂是下一增长点'],
    rating: 'buy',
    priceTarget: 0,
    riskDisclosure: '研发失败风险、价格战、专利到期',
    publishedAt: '2024-06-10',
    readCount: 3100,
    downloadCount: 1120,
  },
  {
    id: 'RPT-008',
    reportTitle: '微软Copilot商业化进展与企业软件变革',
    targetCompany: 'Microsoft Corp',
    industry: '企业软件/AI',
    reportType: 'deep_dive',
    author: 'human',
    status: 'archived',
    pages: 42,
    executiveSummary: '微软将AI能力深度整合到Office 365等产品中，Copilot订阅模式开启企业软件新时代...',
    keyFindings: ['Copilot用户数超500万', '企业ARPU提升40%', 'Azure AI服务增速120%', '与OpenAI协同效应显著'],
    rating: 'buy',
    priceTarget: 480,
    riskDisclosure: 'AI安全风险、竞争加剧、经济下行影响IT支出',
    publishedAt: '2024-04-20',
    readCount: 5620,
    downloadCount: 2340,
  },
  {
    id: 'RPT-009',
    reportTitle: '加密货币行业季度报告：ETF通过后的市场演变',
    targetCompany: 'Crypto Sector',
    industry: '数字资产/区块链',
    reportType: 'sector',
    author: 'ai+human',
    status: 'published',
    pages: 65,
    executiveSummary: '比特币现货ETF获批后机构资金持续流入，DeFi生态复苏，监管框架逐步清晰...',
    keyFindings: ['ETF累计净流入$150亿+', 'ETH ETF预期乐观', '稳定币市值创新高', 'RWA赛道快速增长'],
    rating: 'buy',
    priceTarget: 0,
    riskDisclosure: '监管政策变化、市场波动性大、技术安全风险',
    publishedAt: '2024-06-12',
    readCount: 4890,
    downloadCount: 2100,
  },
  {
    id: 'RPT-010',
    reportTitle: '亚马逊AWS云业务深度分析：AI时代的护城河',
    targetCompany: 'Amazon.com Inc',
    industry: '电商/云计算',
    reportType: 'deep_dive',
    author: 'ai_analyst',
    status: 'in_review',
    pages: 52,
    executiveSummary: 'AWS作为亚马逊利润引擎，在AI浪潮中既面临挑战也迎来机遇，Bedrock服务增长迅猛...',
    keyFindings: ['AWS运营利润率30%+', 'Bedrock客户数季增50%', '自研芯片Trainium性能提升', '零售业务为AI提供数据优势'],
    rating: 'buy',
    priceTarget: 195,
    riskDisclosure: 'AWS增速放缓、反垄断调查、AI投入加大短期影响利润',
    publishedAt: '',
    readCount: 180,
    downloadCount: 45,
  },
];

const typeConfig: Record<string, { label: string; color: string }> = {
  deep_dive: { label: '深度研究', color: '#1677FF' },
  earnings: { label: '财报解读', color: '#16A34A' },
  competitive: { label: '竞品分析', color: '#7C3AED' },
  sector: { label: '行业报告', color: '#F59E0B' },
};

const authorConfig: Record<string, { label: string; color: string }> = {
  ai_analyst: { label: 'AI分析师', color: 'cyan' },
  human: { label: '人工撰写', color: 'blue' },
  'ai+human': { label: 'AI+人工', color: 'gold' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  draft: { label: '草稿', color: 'default' },
  in_review: { label: '审核中', color: 'processing' },
  published: { label: '已发布', color: 'success' },
  archived: { label: '已归档', color: 'default' },
};

const ratingConfig: Record<string, { label: string; color: string }> = {
  buy: { label: '买入', color: '#16A34A' },
  hold: { label: '持有', color: '#F59E0B' },
  sell: { label: '卖出', color: '#DC2626' },
};

export default function EnterpriseReportPage() {
  const [selectedReport, setSelectedReport] = useState<ResearchReport | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>('');
  const [filterIndustry, setFilterIndustry] = useState<string>('');
  const [filterAuthor, setFilterAuthor] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');

  const filteredReports = mockReports.filter((report) => {
    if (filterType && report.reportType !== filterType) return false;
    if (filterIndustry && !report.industry.includes(filterIndustry)) return false;
    if (filterAuthor && report.author !== filterAuthor) return false;
    if (filterStatus && report.status !== filterStatus) return false;
    return true;
  });

  const totalReports = mockReports.length;
  const thisMonthPublished = mockReports.filter(
    (r) => r.status === 'published' && dayjs(r.publishedAt).isAfter(dayjs().subtract(1, 'month'))
  ).length;
  const aiGeneratedRatio = Math.round(
    (mockReports.filter((r) => r.author === 'ai_analyst' || r.author === 'ai+human').length / totalReports) * 100
  );
  const avgReads = Math.round(
    mockReports.filter((r) => r.readCount > 0).reduce((sum, r) => sum + r.readCount, 0) /
      mockReports.filter((r) => r.readCount > 0).length
  );
  const totalDownloads = mockReports.reduce((sum, r) => sum + r.downloadCount, 0);

  const columns = [
    {
      title: '报告标题',
      dataIndex: 'reportTitle',
      key: 'reportTitle',
      width: 280,
      ellipsis: true,
      render: (text: string) => <span className="font-semibold text-blue-600">{text}</span>,
    },
    {
      title: '目标公司',
      dataIndex: 'targetCompany',
      key: 'targetCompany',
      render: (text: string) => <span className="font-medium">{text}</span>,
    },
    { title: '行业', dataIndex: 'industry', key: 'industry', width: 140, ellipsis: true },
    {
      title: '类型',
      dataIndex: 'reportType',
      key: 'reportType',
      render: (type: string) => <Tag color={typeConfig[type]?.color}>{typeConfig[type]?.label}</Tag>,
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author',
      render: (author: string) => <Tag color={authorConfig[author]?.color}>{authorConfig[author]?.label}</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => <Tag color={statusConfig[status]?.color}>{statusConfig[status]?.label}</Tag>,
    },
    { title: '页数', dataIndex: 'pages', key: 'pages', render: (v: number) => `${v}页` },
    {
      title: '评级',
      dataIndex: 'rating',
      key: 'rating',
      render: (rating: string) => <Tag color={ratingConfig[rating]?.color}>{ratingConfig[rating]?.label}</Tag>,
    },
    {
      title: '目标价',
      dataIndex: 'priceTarget',
      key: 'priceTarget',
      render: (val: number) => (val > 0 ? `$${val}` : '-'),
    },
    {
      title: '发布日期',
      dataIndex: 'publishedAt',
      key: 'publishedAt',
      render: (val: string) => (val ? dayjs(val).format('YYYY-MM-DD') : '-'),
    },
    {
      title: '阅读',
      dataIndex: 'readCount',
      key: 'readCount',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '下载',
      dataIndex: 'downloadCount',
      key: 'downloadCount',
      render: (val: number) => val.toLocaleString(),
    },
    {
      title: '风险披露',
      dataIndex: 'riskDisclosure',
      key: 'riskDisclosure',
      width: 160,
      ellipsis: true,
      render: (text: string) => (
        <Tooltip title={text}>
          <span className="text-xs text-gray-500">{text}</span>
        </Tooltip>
      ),
    },
  ];

  const actions: any[] = [
    {
      key: 'view',
      label: '全文',
      icon: <FileTextOutlined />,
      onClick: (record: ResearchReport) => {
        setSelectedReport(record);
        setDetailModalOpen(true);
      },
    },
    {
      key: 'edit',
      label: '编辑',
      icon: <EditOutlined />,
      onClick: (record: ResearchReport) => message.info(`编辑报告: ${record.reportTitle}`),
    },
    {
      key: 'publish',
      label: (_: any, record: ResearchReport) =>
        record.status === 'draft' || record.status === 'in_review' ? '发布' : '归档',
      icon: <InboxOutlined />,
      onClick: (record: ResearchReport) =>
        message.success(`报告 ${record.reportTitle} 已${record.status === 'archived' ? '重新发布' : record.status === 'published' ? '归档' : '发布'}`),
    },
    {
      key: 'download',
      label: 'PDF',
      icon: <DownloadOutlined />,
      onClick: (record: ResearchReport) => message.success(`正在生成PDF: ${record.id}`),
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold m-0 flex items-center gap-3">
              <FileProtectOutlined style={{ color: '#F0B90B' }} />
              企业研报中心
            </h1>
            <p className="text-gray-500 text-sm mt-2">
              AI生成的深度企业研究报告 · 行研/财报解读/竞品分析 · AIOPC研究引擎
            </p>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => message.success('数据已刷新')}>
              刷新
            </Button>
            <Button type="primary" icon={<PlusOutlined />}>
              创建研报
            </Button>
          </Space>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <DataCard
            title="研报总数"
            value={totalReports}
            icon={<FileTextOutlined />}
            color="#1677FF"
            description="全部研究报告"
          />
          <DataCard
            title="本月发布"
            value={thisMonthPublished}
            icon={<ThunderboltOutlined />}
            color="#16A34A"
            description="新增研报"
          />
          <DataCard
            title="AI生成占比"
            value={`${aiGeneratedRatio}%`}
            icon={<StarOutlined />}
            color="#7C3AED"
            description="智能辅助比例"
          />
          <DataCard
            title="平均阅读量"
            value={avgReads.toLocaleString()}
            icon={<ReadOutlined />}
            color="#F59E0B"
            description="单篇均值"
          />
          <DataCard
            title="下载总量"
            value={totalDownloads.toLocaleString()}
            icon={<DownloadOutlined />}
            color="#F0B90B"
            description="累计下载数"
          />
        </div>

        {/* 筛选区域 */}
        <Card size="small">
          <Space wrap>
            <Select placeholder="报告类型" style={{ width: 130 }} allowClear value={filterType || undefined} onChange={setFilterType}>
              <Option value="deep_dive">深度研究</Option>
              <Option value="earnings">财报解读</Option>
              <Option value="competitive">竞品分析</Option>
              <Option value="sector">行业报告</Option>
            </Select>
            <Select placeholder="行业" style={{ width: 150 }} allowClear value={filterIndustry || undefined} onChange={setFilterIndustry}>
              <Option value="半导体">半导体</Option>
              <Option value="云计算">云计算</Option>
              <Option value="新能源">新能源</Option>
              <Option value="生物医药">生物医药</Option>
              <Option value="数字资产">数字资产</Option>
            </Select>
            <Select placeholder="作者" style={{ width: 120 }} allowClear value={filterAuthor || undefined} onChange={setFilterAuthor}>
              <Option value="ai_analyst">AI分析师</Option>
              <Option value="human">人工撰写</Option>
              <Option value="ai+human">AI+人工</Option>
            </Select>
            <Select placeholder="状态" style={{ width: 110 }} allowClear value={filterStatus || undefined} onChange={setFilterStatus}>
              <Option value="draft">草稿</Option>
              <Option value="in_review">审核中</Option>
              <Option value="published">已发布</Option>
              <Option value="archived">已归档</Option>
            </Select>
          </Space>
        </Card>

        {/* 数据表格 */}
        <DataTable columns={columns as any} dataSource={filteredReports as any} rowKey="id" actions={actions} showSearch={false} showAdd={false} />

        {/* 详情弹窗 */}
        <Modal
          title={
            <span>
              研报详情 - <span style={{ color: '#F0B90B' }}>{selectedReport?.id}</span>
            </span>
          }
          open={detailModalOpen}
          onCancel={() => setDetailModalOpen(false)}
          footer={[
            <Button key="close" onClick={() => setDetailModalOpen(false)}>关闭</Button>,
            <Button key="download" icon={<DownloadOutlined />}>下载PDF</Button>,
          ]}
          width={900}
        >
          {selectedReport && (
            <div className="space-y-6">
              {/* 报告元数据 */}
              <Divider orientation="left">报告元数据</Divider>
              <Descriptions column={2} bordered size="small">
                <Descriptions.Item label="报告ID"><code>{selectedReport.id}</code></Descriptions.Item>
                <Descriptions.Item label="标题" span={3}>{selectedReport.reportTitle}</Descriptions.Item>
                <Descriptions.Item label="目标公司">{selectedReport.targetCompany}</Descriptions.Item>
                <Descriptions.Item label="行业">{selectedReport.industry}</Descriptions.Item>
                <Descriptions.Item label="报告类型">
                  <Tag color={typeConfig[selectedReport.reportType]?.color}>{typeConfig[selectedReport.reportType]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="作者">
                  <Tag color={authorConfig[selectedReport.author]?.color}>{authorConfig[selectedReport.author]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="状态">
                  <Tag color={statusConfig[selectedReport.status]?.color}>{statusConfig[selectedReport.status]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="页数">{selectedReport.pages}页</Descriptions.Item>
                <Descriptions.Item label="评级">
                  <Tag color={ratingConfig[selectedReport.rating]?.color}>{ratingConfig[selectedReport.rating]?.label}</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="目标价">{selectedReport.priceTarget > 0 ? `$${selectedReport.priceTarget}` : '-'}</Descriptions.Item>
                <Descriptions.Item label="发布日期">{selectedReport.publishedAt ? dayjs(selectedReport.publishedAt).format('YYYY-MM-DD') : '-'}</Descriptions.Item>
                <Descriptions.Item label="阅读量">{selectedReport.readCount.toLocaleString()}</Descriptions.Item>
                <Descriptions.Item label="下载量">{selectedReport.downloadCount.toLocaleString()}</Descriptions.Item>
              </Descriptions>

              {/* 核心发现 */}
              <Divider orientation="left">核心发现</Divider>
              <Card size="small">
                <ul className="space-y-2">
                  {selectedReport.keyFindings.map((finding, idx) => (
                    <li key={idx} className="flex gap-2">
                      <StarOutlined style={{ color: '#F0B90B', marginTop: 4 }} />
                      <span>{finding}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* 执行摘要 */}
              <Divider orientation="left">执行摘要</Divider>
              <Card size="small">
                <p className="text-gray-700 leading-relaxed">{selectedReport.executiveSummary}</p>
              </Card>

              {/* AIOPC研究质量评分 */}
              <Divider orientation="left">
                <StarOutlined style={{ color: '#F0B90B' }} /> AIOPC研究质量评分
              </Divider>
              <Card
                size="small"
                style={{
                  background: 'linear-gradient(135deg, #FFF9E6 0%, #FFFDF5 100%)',
                  borderColor: '#F0B90B',
                }}
              >
                <div className="mb-3">
                  <span className="text-lg font-bold" style={{ color: '#F0B90B' }}>综合质量评分: 92/100</span>
                </div>
                <Space direction="vertical" className="w-full" size="middle">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">数据完整性</span>
                      <span className="text-sm font-semibold">96%</span>
                    </div>
                    <Progress percent={96} strokeColor="#1677FF" showInfo={false} size="small" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">分析深度</span>
                      <span className="text-sm font-semibold">91%</span>
                    </div>
                    <Progress percent={91} strokeColor="#16A34A" showInfo={false} size="small" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">逻辑严谨性</span>
                      <span className="text-sm font-semibold">94%</span>
                    </div>
                    <Progress percent={94} strokeColor="#7C3AED" showInfo={false} size="small" />
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm">时效性</span>
                      <span className="text-sm font-semibold">88%</span>
                    </div>
                    <Progress percent={88} strokeColor="#F0B90B" showInfo={false} size="small" />
                  </div>
                </Space>
              </Card>

              {/* 风险披露 */}
              <Divider orientation="left">风险披露</Divider>
              <Card size="small" style={{ background: '#FEF2F2', borderColor: '#DC2626' }}>
                <AlertOutlined style={{ color: '#DC2626', marginRight: 8 }} />
                <span className="font-semibold text-red-700">风险提示：</span>
                <span className="text-red-600 ml-2">{selectedReport.riskDisclosure}</span>
              </Card>

              {/* 引用数据 */}
              <Divider orientation="left">引用数据来源</Divider>
              <Table
                size="small"
                pagination={false}
                dataSource={[
                  { source: '公司财报', date: selectedReport.publishedAt || '2024-06', reliability: '官方' },
                  { source: 'Bloomberg终端', date: '2024-06-23', reliability: '高' },
                  { source: 'Wind金融数据库', date: '2024-06-22', reliability: '高' },
                  { source: 'SEC EDGAR filings', date: '2024-06-20',可靠性: '官方' },
                ]}
                columns={[
                  { title: '数据源', dataIndex: 'source', key: 'source' },
                  { title: '更新时间', dataIndex: 'date', key: 'date' },
                  {
                    title: '可靠度',
                    dataIndex: 'reliability',
                    key: 'reliability',
                    render: (val: string) => (
                      <Tag color={val === '官方' ? 'green' : 'blue'}>{val}</Tag>
                    ),
                  },
                ]}
                rowKey="source"
              />

              {/* 版本历史 */}
              <Divider orientation="left">版本历史</Divider>
              <Table
                size="small"
                pagination={false}
                dataSource={[
                  { version: 'v1.0', date: selectedReport.publishedAt || dayjs().format('YYYY-MM-DD'), changes: '初始版本发布', editor: selectedReport.author },
                  { version: 'v0.9', date: dayjs(selectedReport.publishedAt || new Date()).subtract(2, 'day').format('YYYY-MM-DD'), changes: '终稿审核', editor: 'reviewer' },
                  { version: 'v0.5', date: dayjs(selectedReport.publishedAt || new Date()).subtract(5, 'day').format('YYYY-MM-DD'), changes: '补充数据分析', editor: selectedReport.author },
                ]}
                columns={[
                  { title: '版本', dataIndex: 'version', key: 'version' },
                  { title: '日期', dataIndex: 'date', key: 'date' },
                  { title: '变更内容', dataIndex: 'changes', key: 'changes' },
                  { title: '操作人', dataIndex: 'editor', key: 'editor' },
                ]}
                rowKey="version"
              />
            </div>
          )}
        </Modal>
      </div>
    </AdminLayout>
  );
}
